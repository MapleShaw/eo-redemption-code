import type { XUser, SessionData, AuthCheckResponse } from '../../src/types/user'
import { APP_CONFIG } from '../../src/lib/constants'

interface EdgeOneContext {
  request: Request
  env: {
    [key: string]: string | undefined
  }
  params: Record<string, string>
}

export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.DEV === 'true' ? 'http://localhost:3000' : '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }

  try {
    // Get session cookie
    const cookieHeader = request.headers.get('Cookie')
    if (!cookieHeader) {
      return new Response(
        JSON.stringify({ loggedIn: false } as AuthCheckResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Parse session cookie
    const sessionCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith(`${APP_CONFIG.session.cookieName}=`))
    
    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ loggedIn: false } as AuthCheckResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const sessionId = sessionCookie.split('=')[1]
    
    // Get session data from KV
    const sessionKey = `${APP_CONFIG.kv.prefixes.sessions}${sessionId}`
    // Note: EdgeOne KV operations would be implemented here
    // For now, we'll simulate with a placeholder
    const sessionDataStr = await getFromKV(sessionKey, env)
    
    if (!sessionDataStr) {
      return new Response(
        JSON.stringify({ loggedIn: false } as AuthCheckResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr)
    
    return new Response(
      JSON.stringify({
        loggedIn: true,
        user: sessionData.userProfile,
      } as AuthCheckResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Error checking auth:', error)
    
    return new Response(
      JSON.stringify({ 
        loggedIn: false, 
        error: 'Internal server error' 
      } as AuthCheckResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
}

// EdgeOne KV operations using bound namespace
async function getFromKV(key: string, env: any): Promise<string | null> {
  // Access KV through bound variable (configured in EdgeOne Pages dashboard)
  // Assuming 'user_sessions_kv' is the bound KV namespace variable name
  if (env.user_sessions_kv) {
    try {
      return await env.user_sessions_kv.get(key)
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }
  return null
} 