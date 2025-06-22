import { getRedirectUrl } from '../../src/lib/utils'

interface EdgeOneContext {
  request: Request
  env: {
    [key: string]: string | undefined
  }
  params: Record<string, string>
}

export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context

  console.log('=== CALLBACK DEBUG START ===')
  console.log('Request URL:', request.url)
  console.log('Environment variables:')
  console.log('- DEV:', env.DEV)
  console.log('- FRONT_END_URL_DEV:', env.FRONT_END_URL_DEV)
  console.log('- X_CLIENT_ID:', env.X_CLIENT_ID ? 'SET' : 'MISSING')
  console.log('- X_CLIENT_SECRET:', env.X_CLIENT_SECRET ? 'SET' : 'MISSING')
  console.log('- X_REDIRECT_URI:', env.X_REDIRECT_URI)

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

    // For debugging, just redirect to success page with parameters
    const successUrl = getRedirectUrl(`/success?debug=true&code_received=${!!code}&state_received=${!!state}`, env)
    console.log('Redirecting to success page:', successUrl)
    console.log('=== CALLBACK DEBUG END ===')
    
    return Response.redirect(successUrl, 302)
  } catch (error) {
    console.error('Callback error:', error)
    const errorUrl = getRedirectUrl('/error?reason=auth_error&detail=server_error', env)
    console.log('Redirecting to error page due to exception:', errorUrl)
    return Response.redirect(errorUrl, 302)
  }
} 