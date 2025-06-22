import type { XOAuthTokenResponse, XUserResponse } from '../../src/types/oauth'
import type { SessionData } from '../../src/types/user'
import { APP_CONFIG } from '../../src/lib/constants'
import { generateSessionId, getRedirectUrl } from '../../src/lib/utils'

interface EdgeOneContext {
  request: Request
  env: {
    [key: string]: string | undefined
  }
  params: Record<string, string>
}

export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return Response.redirect(
        getRedirectUrl(`/error?reason=auth_error&detail=${encodeURIComponent(error)}`), 
        302
      )
    }

    if (!code || !state) {
      return Response.redirect(
        getRedirectUrl('/error?reason=auth_error&detail=missing_code_or_state'), 
        302
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch(APP_CONFIG.twitter.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: env.X_REDIRECT_URI || '',
        client_id: env.X_CLIENT_ID || '',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return Response.redirect(
        getRedirectUrl('/error?reason=auth_error&detail=token_exchange_failed'), 
        302
      )
    }

    const tokenData: XOAuthTokenResponse = await tokenResponse.json()

    // Get user profile
    const userResponse = await fetch(APP_CONFIG.twitter.userUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('User fetch failed:', await userResponse.text())
      return Response.redirect(
        getRedirectUrl('/error?reason=auth_error&detail=user_fetch_failed'), 
        302
      )
    }

    const userData: XUserResponse = await userResponse.json()

    // Create session
    const sessionId = generateSessionId()
    const sessionData: SessionData = {
      accessToken: tokenData.access_token, // In production, encrypt this
      userProfile: userData.data,
    }

    // Store session in KV
    const sessionKey = `${APP_CONFIG.kv.prefixes.sessions}${sessionId}`
    await putToKV(sessionKey, JSON.stringify(sessionData), env)

    // Create secure cookie
    const cookieMaxAge = APP_CONFIG.session.maxAge
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = [
      `${APP_CONFIG.session.cookieName}=${sessionId}`,
      `Max-Age=${Math.floor(cookieMaxAge / 1000)}`,
      'HttpOnly',
      ...(isProduction ? ['Secure'] : []), // Only use Secure in production (HTTPS)
      'SameSite=Lax',
      'Path=/',
    ]

    const response = Response.redirect(getRedirectUrl('/'), 302)
    response.headers.set('Set-Cookie', cookieOptions.join('; '))

    return response
  } catch (error) {
    console.error('Callback error:', error)
    return Response.redirect(
      getRedirectUrl('/error?reason=auth_error&detail=server_error'), 
      302
    )
  }
}

// EdgeOne KV operations using bound namespace
async function putToKV(key: string, value: string, env: any): Promise<void> {
  // Access KV through bound variable (configured in EdgeOne Pages dashboard)
  if (env.user_sessions_kv) {
    try {
      await env.user_sessions_kv.put(key, value)
      console.log(`Stored in KV: ${key}`)
    } catch (error) {
      console.error('KV put error:', error)
      throw error
    }
  } else {
    console.error('KV namespace not bound')
    throw new Error('KV namespace not available')
  }
} 