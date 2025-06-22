import { APP_CONFIG } from '../../src/lib/constants'
import { createOAuthState, createCodeVerifier, createCodeChallenge } from '../../src/lib/utils'

export async function onRequest(context: any): Promise<Response> {
  const { request, params, env, user_sessions_kv } = context

  try {
    // Generate OAuth state and PKCE parameters
    const baseState = createOAuthState()
    const codeVerifier = createCodeVerifier()
    const codeChallenge = await createCodeChallenge(codeVerifier)
    
    // 在开发环境中，将codeVerifier编码到state中
    const isDev = env.DEV === 'true'
    const state = isDev ? `${baseState}:${btoa(codeVerifier)}` : baseState
    
    console.log('=== LOGIN WITH PKCE DEBUG ===')
    console.log('Generated state:', state)
    console.log('Generated code_verifier length:', codeVerifier.length)
    console.log('Generated code_challenge:', codeChallenge)
    console.log('Client ID:', env.X_CLIENT_ID ? 'SET' : 'MISSING')
    console.log('Redirect URI:', env.X_REDIRECT_URI)
    console.log('Scope:', APP_CONFIG.twitter.scope)
    
    // Store PKCE data in KV for callback validation
    const sessionKey = `pkce_session:${baseState}`
    const sessionData = {
      codeVerifier,
      state: baseState,
      timestamp: Date.now()
    }
    
    // Store in KV (expires in 10 minutes)
    try {
      if (user_sessions_kv) {
        // 使用EdgeOne Pages KV的正确方式
        await user_sessions_kv.put(sessionKey, JSON.stringify(sessionData), { expirationTtl: 600 })
        console.log('Stored PKCE session in KV:', sessionKey)
      } else {
        console.warn('KV not available, storing in memory for dev (INSECURE)')
        // 开发环境临时存储（仅用于测试）
        // 由于EdgeOne Functions的执行环境隔离，我们需要另想办法
        console.log('Dev mode: will encode verifier in state for callback')
      }
    } catch (kvError) {
      console.warn('KV store failed, using dev mode workaround:', kvError)
      console.log('Dev mode: will encode verifier in state for callback')
    }
    
    // Build OAuth URL with PKCE
    const authUrl = new URL(APP_CONFIG.twitter.authUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', env.X_CLIENT_ID || '')
    authUrl.searchParams.set('redirect_uri', env.X_REDIRECT_URI || '')
    authUrl.searchParams.set('scope', APP_CONFIG.twitter.scope)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    
    console.log('OAuth URL with PKCE:', authUrl.toString())
    console.log('=== LOGIN PKCE DEBUG END ===')
    
    return Response.redirect(authUrl.toString(), 302)
  } catch (error) {
    console.error('Login redirect error:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 