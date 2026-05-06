import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, bookingData } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Captcha token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Verify Cloudflare Turnstile Token
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secretKey) {
        throw new Error('TURNSTILE_SECRET_KEY is not set in Edge Function env variables')
    }

    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const cfData = await cfResponse.json()

    if (!cfData.success) {
      console.error('Turnstile verification failed:', cfData)
      return new Response(JSON.stringify({ error: 'Captcha verification failed (Bot detected)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Token is valid. Proceed to insert booking into Supabase.
    // Use Service Role key to securely insert the booking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabaseClient
      .from('bookings')
      .insert([bookingData])
      .select()
      .maybeSingle()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
