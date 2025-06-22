import type { XUser, SessionData, AuthCheckResponse } from '../../src/types/user'

// EdgeOne Pages KV全局变量声明
declare global {
  var user_sessions_kv: any
  var redemption_codes_kv: any
}

export async function onRequest(context: any): Promise<Response> {
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

    // Parse session cookie (匹配callback设置的cookie名)
    const sessionCookie = cookieHeader
      .split(';')
      .find((c: string) => c.trim().startsWith('eo_session='))
    
    if (!sessionCookie) {
      console.log('No eo_session cookie found')
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
    console.log('Found session ID:', sessionId)
    
    // Get session data from KV (匹配callback存储的键格式)
    const sessionKey = `user_session:${sessionId}`
    console.log('Looking for session key:', sessionKey)
    const sessionDataStr = await getFromKV(sessionKey)
    
    if (!sessionDataStr) {
      console.log('Session not found in KV')
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
    console.log('Found session data for user:', sessionData.userProfile?.username)
    
    return new Response(
      JSON.stringify({
        loggedIn: true,
        userProfile: sessionData.userProfile,
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

// EdgeOne KV operations using global variables
async function getFromKV(key: string): Promise<string | null> {
  try {
    if (user_sessions_kv) {
      console.log('Trying KV get for key:', key)
      const result = await user_sessions_kv.get(key)
      console.log('KV get result:', result ? 'FOUND' : 'NOT_FOUND')
      return result
    } else {
      console.log('KV not available, checking dev memory')
      // 开发环境回退到内存存储
      if ((global as any).devUserSessions) {
        const result = (global as any).devUserSessions.get(key)
        console.log('Dev memory get result:', result ? 'FOUND' : 'NOT_FOUND')
        return result
      }
      return null
    }
  } catch (error) {
    console.error('KV get error:', error)
    return null
  }
} 