import { APP_CONFIG } from '../../src/lib/constants'
import { createOAuthState, createCodeVerifier, createCodeChallenge } from '../../src/lib/utils'

interface EdgeOneContext {
  request: Request
  env: {
    [key: string]: string | undefined
  }
  params: Record<string, string>
}

export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { env } = context

  try {
    // Generate OAuth state
    const state = createOAuthState()
    
    console.log('=== LOGIN DEBUG ===')
    console.log('Generated state:', state)
    console.log('Client ID:', env.X_CLIENT_ID ? 'SET' : 'MISSING')
    console.log('Redirect URI:', env.X_REDIRECT_URI)
    console.log('Scope:', APP_CONFIG.twitter.scope)
    
    // Build simple OAuth URL (without PKCE for now)
    const authUrl = new URL(APP_CONFIG.twitter.authUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', env.X_CLIENT_ID || '')
    authUrl.searchParams.set('redirect_uri', env.X_REDIRECT_URI || '')
    authUrl.searchParams.set('scope', APP_CONFIG.twitter.scope)
    authUrl.searchParams.set('state', state)
    
    console.log('OAuth URL:', authUrl.toString())
    console.log('=== LOGIN DEBUG END ===')
    
    // TODO: Store codeVerifier and state in KV for later validation
    // For now, we'll skip this step for debugging
    
    return Response.redirect(authUrl.toString(), 302)
  } catch (error) {
    console.error('Login redirect error:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 