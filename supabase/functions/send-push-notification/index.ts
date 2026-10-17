import webpush from "npm:web-push@3.6.7"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BOMdHZWawV8n1ZHEjCjZ9Ux1m1v4qnXcMPsgFe-ci94efc6NTlfP2YakF6M6yDBcD88TdxQinlJdhj-pMSWfRq8'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'Pj2YPwsf9cUW0I4qeDsKLdsaemDknnwemRxAJyI9t8Y'
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@chinhastore.vn'

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
} catch (e) {
  console.error("VAPID setup error:", e)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    console.log("send-push-notification received payload:", JSON.stringify(body))

    // 1. Resolve content (handles direct invocation or database webhook payload)
    let title = body.title
    let message = body.body
    let tag = body.tag || `booking-${Date.now()}`
    const booking = body.booking || body.record || {}
    const bookingId = booking.id || ''
    const bookingCode = booking.booking_id || (bookingId ? String(bookingId).slice(0, 8).toUpperCase() : 'MỚI')

    const isConfirmed = body.type === 'confirmed' || 
                        body.isConfirmed === true || 
                        booking.status === 'Confirmed'

    const formatPrice = (val: any) => {
      const num = Number(val) || 0
      return new Intl.NumberFormat('vi-VN').format(num) + ' đ'
    }

    const formatDate = (val: any) => {
      if (!val) return ''
      try {
        const d = new Date(val)
        if (isNaN(d.getTime())) return String(val)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
      } catch {
        return String(val)
      }
    }

    const startTimeRaw = body.start_time || booking.start_time || booking.start_date
    const endTimeRaw = body.end_time || booking.end_time || booking.end_date
    const dateRangeText = (startTimeRaw && endTimeRaw)
      ? `${formatDate(startTimeRaw)} - ${formatDate(endTimeRaw)}`
      : (startTimeRaw ? formatDate(startTimeRaw) : 'Chưa cập nhật')

    const statusHeader = isConfirmed ? 'CHỐT ĐƠN TỰ ĐỘNG' : 'CHỜ XÁC NHẬN'
    const paymentStatus = isConfirmed ? 'Đã thanh toán (SePay)' : 'Chưa thanh toán'
    const customerDisplayName = body.customerName ? `${body.customerName}${body.phone ? ` (${body.phone})` : ''}` : 'Khách hàng mới'
    const productDisplayName = body.productName || 'Thiết bị máy ảnh'
    const totalPriceText = formatPrice(body.total_price || booking.total_price || 0)

    if (!title) {
      title = 'Có đơn thuê máy ảnh mới ChinHaStore'
    }

    if (!message) {
      message = `[${statusHeader}]\n[#${bookingCode}]\n[${paymentStatus}]\nTên khách hàng: ${customerDisplayName}\nLoại máy: ${productDisplayName}\nThời gian thuê: ${dateRangeText}\nTổng tiền thuê: ${totalPriceText}\nChạm vào để mở đơn thuê này`
    }

    // 2. Fetch push subscriptions from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jlxccojxwrfgtowyhhjk.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')

    if (subError) {
      console.warn("Lỗi khi truy vấn push_subscriptions:", subError.message)
    }

    const subCount = subscriptions?.length || 0
    console.log(`Tìm thấy ${subCount} thiết bị đăng ký nhận thông báo Apple/Browser.`)

    if (subCount === 0) {
      return new Response(JSON.stringify({
        success: true,
        sentCount: 0,
        message: "Không có thiết bị nào trong push_subscriptions (hãy bấm 'Bật thông báo' trên iPhone PWA để lưu token)."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 3. Prepare payload for Service Worker
    const pushPayload = JSON.stringify({
      title,
      body: message,
      tag: tag || `booking-${isConfirmed ? 'confirmed' : 'pending'}-${bookingId || Date.now()}`,
      data: {
        url: `/quanly-chinha-trungtam?tab=manager${bookingId ? `&booking=${bookingId}&booking_id=${bookingId}` : ''}`,
        bookingId: bookingId,
        isConfirmed: isConfirmed
      }
    })

    // 4. Send to all devices in parallel via Apple APNs / Web Push
    let successCount = 0
    let failedCount = 0
    const deadEndpoints: string[] = []

    const sendPromises = subscriptions!.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, pushPayload, {
          TTL: 86400, // Keep in Apple push queue up to 24 hours
          urgency: 'high'
        })
        successCount++
      } catch (pushErr: any) {
        console.warn(`Gửi tới ${sub.endpoint.slice(0, 45)}... thất bại:`, pushErr.statusCode || pushErr.message)
        failedCount++
        // 404/410 means subscription is no longer valid or user deleted the PWA
        if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
          deadEndpoints.push(sub.endpoint)
        }
      }
    })

    await Promise.allSettled(sendPromises)

    // 5. Cleanup invalid/dead subscriptions
    if (deadEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', deadEndpoints)
      console.log(`Đã dọn dẹp ${deadEndpoints.length} token push hết hạn.`)
    }

    return new Response(JSON.stringify({
      success: true,
      sentCount: successCount,
      failedCount: failedCount,
      totalDevices: subCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error("send-push-notification exception:", err)
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
