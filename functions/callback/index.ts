import { getRedirectUrl, generateSessionId } from '../../src/lib/utils'
import { APP_CONFIG } from '../../src/lib/constants'

// EdgeOne Pages KV全局变量声明
declare global {
  var user_sessions_kv: any
  var redemption_codes_kv: any
}

interface PKCESessionData {
  codeVerifier: string
  state: string
  timestamp: number
}

export async function onRequest(context: any): Promise<Response> {
  const { request, params, env } = context
  console.log('=== CALLBACK DEBUG START ===')
  console.log('Request URL:', request.url)
  console.log('Environment variables:')
  console.log('- DEV:', env.DEV)
  console.log('- FRONT_END_URL_DEV:', env.FRONT_END_URL_DEV)
  console.log('- X_CLIENT_ID:', env.X_CLIENT_ID ? 'SET' : 'MISSING')
  console.log('- X_CLIENT_SECRET:', env.X_CLIENT_SECRET ? 'SET' : 'MISSING')
  console.log('- X_REDIRECT_URI:', env.X_REDIRECT_URI)
  console.log('=== KV DEBUG ===')
  console.log('- user_sessions_kv (global):', typeof user_sessions_kv, user_sessions_kv ? 'AVAILABLE' : 'MISSING')
  console.log('- redemption_codes_kv (global):', typeof redemption_codes_kv, redemption_codes_kv ? 'AVAILABLE' : 'MISSING')

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    console.log('OAuth parameters:')
    console.log('- code:', code ? 'RECEIVED' : 'MISSING')
    console.log('- state:', state ? 'RECEIVED' : 'MISSING')
    console.log('- error:', error || 'NONE')

    if (error) {
      console.log('OAuth error detected:', error)
      const errorUrl = getRedirectUrl(`/error?reason=auth_error&detail=${encodeURIComponent(error)}`, env)
      console.log('Redirecting to error page:', errorUrl)
      return Response.redirect(errorUrl, 302)
    }

    if (!code || !state) {
      console.log('Missing code or state parameter')
      const errorUrl = getRedirectUrl('/error?reason=auth_error&detail=missing_code_or_state', env)
      console.log('Redirecting to error page:', errorUrl)
      return Response.redirect(errorUrl, 302)
    }

    // Retrieve PKCE session data
    let pkceSession: PKCESessionData | null = null
    let baseState = state
    let codeVerifier = ''
    
    // 检查是否是开发环境的编码state（包含codeVerifier）
    const isDev = env.DEV === 'true'
    if (isDev && state.includes(':')) {
      const [extractedBaseState, encodedVerifier] = state.split(':')
      baseState = extractedBaseState
      codeVerifier = atob(encodedVerifier)
      console.log('Dev mode: extracted baseState and codeVerifier from state')
      
      // 创建临时会话
      pkceSession = {
        codeVerifier,
        state: baseState,
        timestamp: Date.now()
      }
    } else {
      // 生产环境或正常开发环境：从KV获取
      const sessionKey = `pkce_session:${baseState}`
      
      try {
        if (user_sessions_kv) {
          // 使用EdgeOne Pages KV的正确方式
          const sessionDataStr = await user_sessions_kv.get(sessionKey)
          if (sessionDataStr) {
            const retrievedSession = JSON.parse(sessionDataStr) as PKCESessionData
            console.log('Retrieved PKCE session from KV:', sessionKey)
            
            // Validate state matches
            if (retrievedSession.state !== baseState) {
              console.error('State mismatch in PKCE session')
              const errorUrl = getRedirectUrl('/error?reason=auth_error&detail=state_mismatch', env)
              return Response.redirect(errorUrl, 302)
            }
            
            pkceSession = retrievedSession
          } else {
            console.error('PKCE session not found in KV:', sessionKey)
          }
        } else {
          console.warn('KV not available in production mode')
        }
      } catch (kvError) {
        console.warn('KV get failed:', kvError)
      }
    }

    if (!pkceSession) {
      console.error('No valid PKCE session found')
      const errorUrl = getRedirectUrl('/error?reason=auth_error&detail=no_pkce_session', env)
      return Response.redirect(errorUrl, 302)
    }

    // TODO: Fix network issue with X API later
    // For now, simulate successful token exchange to test KV flow
    console.log('TEMP: Simulating successful token exchange (network issue to be fixed)')
    
    const tokenData = {
      access_token: 'temp_token_' + Date.now(),
      token_type: 'bearer',
      scope: 'users.read'
    }
    
    console.log('Simulated token data:', {
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      access_token: 'SIMULATED'
    })
    
    // Create user session with simulated user data
    // 为了避免重复session，使用固定的用户ID
    const mockUserId = 'mock_user_12345' // 固定ID，实际项目中应该从X API获取真实用户ID
    const sessionId = `session_${mockUserId}` // 基于用户ID的固定sessionId
    
    const sessionData = {
      userProfile: {
        id: mockUserId,
        username: 'test_user',
        name: 'Test User',
        profile_image_url: '/default-avatar.png'
      },
      accessToken: tokenData.access_token,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
    
    // Store session in KV (这样每次登录都会更新同一个session记录)
    const sessionKey = `user_session:${sessionId}`
    try {
      if (user_sessions_kv) {
        // 检查是否已存在该用户的session
        const existingSession = await user_sessions_kv.get(sessionKey)
        if (existingSession) {
          console.log('Updating existing session for user:', mockUserId)
        } else {
          console.log('Creating new session for user:', mockUserId)
        }
        
        await user_sessions_kv.put(sessionKey, JSON.stringify(sessionData), { expirationTtl: 86400 }) // 24 hours
        console.log('User session stored in KV with key:', sessionKey)
      } else {
        // 开发环境：存储到内存
        if (!(global as any).devUserSessions) {
          (global as any).devUserSessions = new Map()
        }
        ;(global as any).devUserSessions.set(sessionKey, JSON.stringify(sessionData))
        console.log('User session stored in dev memory')
      }
    } catch (kvError) {
      console.warn('KV session store failed, using dev memory:', kvError)
      if (!(global as any).devUserSessions) {
        (global as any).devUserSessions = new Map()
      }
      ;(global as any).devUserSessions.set(sessionKey, JSON.stringify(sessionData))
    }
    
    // Set session cookie (开发环境不限制域名以支持跨端口访问)
    const isDevMode = env.DEV === 'true'
    const cookieValue = isDevMode 
      ? `eo_session=${sessionId}; Path=/; SameSite=Lax; Max-Age=86400` // 开发环境去掉HttpOnly以支持跨域
      : `eo_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400` // 生产环境保持安全
    console.log('Setting session cookie:', cookieValue)
    console.log('Session data stored:', {
      sessionId,
      sessionKey,
      userProfile: sessionData.userProfile.username
    })

    // Clean up PKCE session
    try {
      if (user_sessions_kv && !isDevMode) {
        // 只在生产环境清理KV
        const sessionKey = `pkce_session:${baseState}`
        await user_sessions_kv.delete(sessionKey)
        console.log('PKCE session cleaned up from KV')
      } else {
        console.log('Dev mode: no KV cleanup needed')
      }
    } catch (kvError) {
      console.warn('KV delete failed:', kvError)
    }

    // Redirect to success page with session cookie
    const successUrl = getRedirectUrl('/success', env)
    console.log('Redirecting to success page:', successUrl)
    console.log('=== CALLBACK DEBUG END ===')
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': successUrl,
        'Set-Cookie': cookieValue
      }
    })
  } catch (error) {
    console.error('Callback error:', error)
    const errorUrl = getRedirectUrl('/error?reason=auth_error&detail=server_error', env)
    console.log('Redirecting to error page due to exception:', errorUrl)
    return Response.redirect(errorUrl, 302)
  }
} 