import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Check if it's a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const rawBody = await req.text()

    // --- BẢO MẬT WEBHOOK ---
    // Chỉ sử dụng xác thực qua tham số URL (bỏ qua Header HMAC do bị chặn bởi API Gateway)
    // Dùng biến môi trường để không lộ secret key khi push code
    const secretKey = Deno.env.get('SEPAY_WEBHOOK_SECRET')
    
    const url = new URL(req.url)
    const urlSecret = url.searchParams.get('secret')

    if (urlSecret !== secretKey) {
      console.warn("Chặn truy cập: Tham số secret trên URL không hợp lệ")
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Parse the payload from SePay
    const data = JSON.parse(rawBody)
    console.log("Received webhook from SePay:", data)

    const content = data.content;
    const amount = data.transferAmount;
    const type = data.transferType;

    // Only process incoming transfers
    if (type !== 'in') {
      return new Response(JSON.stringify({ message: 'Ignored non-incoming transfer' }), { status: 200 })
    }

    // Check syntax: CHINHA <ID> (allow missing space)
    const match = content.match(/CHINHA\s*([A-Za-z0-9_-]+)/i)
    if (!match) {
      return new Response(JSON.stringify({ message: 'No valid syntax found' }), { status: 200 })
    }

    const bookingIdCode = match[1]

    // Setup Supabase Client using Service Role Key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the booking using booking_id (the 6-digit code)
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', bookingIdCode)
      .single()

    if (fetchError || !booking) {
      console.log(`Booking ${bookingIdCode} not found`)
      return new Response(JSON.stringify({ message: 'Booking not found' }), { status: 404 })
    }

    // Check if it's already confirmed
    if (booking.status === 'Confirmed') {
      return new Response(JSON.stringify({ message: 'Booking already confirmed' }), { status: 200 })
    }

    // Update status to Confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'Confirmed' })
      .eq('booking_id', bookingIdCode)

    if (updateError) {
      console.error("Failed to update booking:", updateError)
      return new Response(JSON.stringify({ error: 'Failed to update booking' }), { status: 500 })
    }

    console.log(`Successfully confirmed booking ${bookingId}`)
    return new Response(JSON.stringify({ success: true, message: `Booking ${bookingId} confirmed` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
