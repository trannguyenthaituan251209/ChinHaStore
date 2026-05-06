import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Captcha token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secretKey) {
        throw new Error('TURNSTILE_SECRET_KEY is not set')
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
      return new Response(JSON.stringify({ error: 'Captcha verification failed', details: cfData }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
