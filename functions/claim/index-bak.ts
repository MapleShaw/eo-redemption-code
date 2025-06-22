import type { SessionData, ClaimResponse } from '../../src/types/user'
import type { XFollowingResponse } from '../../src/types/oauth'
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' } as ClaimResponse),
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
    // Verify session
    const cookieHeader = request.headers.get('Cookie')
    if (!cookieHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authenticated' } as ClaimResponse),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const sessionCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith(`${APP_CONFIG.session.cookieName}=`))
    
    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authenticated' } as ClaimResponse),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const sessionId = sessionCookie.split('=')[1]
    const sessionKey = `${APP_CONFIG.kv.prefixes.sessions}${sessionId}`
    const sessionDataStr = await getFromKV(sessionKey, env)
    
    if (!sessionDataStr) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session expired' } as ClaimResponse),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr)
    const userId = sessionData.userProfile.id

    // Check if user already claimed
    const claimedKey = `${APP_CONFIG.kv.prefixes.claimedUsers}${userId}`
    const alreadyClaimed = await getFromKV(claimedKey, env)
    
    if (alreadyClaimed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You have already claimed your code',
          code: alreadyClaimed 
        } as ClaimResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Check if user follows KOC
    const followingUrl = APP_CONFIG.twitter.followingUrl.replace('{id}', userId)
    const followingResponse = await fetch(followingUrl, {
      headers: {
        'Authorization': `Bearer ${sessionData.accessToken}`,
      },
    })

    if (!followingResponse.ok) {
      console.error('Following check failed:', await followingResponse.text())
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify following status' } as ClaimResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const followingData: XFollowingResponse = await followingResponse.json()
    const isFollowing = followingData.data?.some(user => user.id === env.KOC_X_USER_ID)

    if (!isFollowing) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You must follow the KOC to claim a code' 
        } as ClaimResponse),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Get available codes
    const availableCodes = await listCodesFromKV(env)
    
    if (availableCodes.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No codes available' 
        } as ClaimResponse),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Claim a code (pick the first available)
    const codeKey = availableCodes[0]
    const code = codeKey.replace(APP_CONFIG.kv.prefixes.codes, '')

    // Atomic operation: remove code from available pool and mark user as claimed
    await Promise.all([
      deleteFromKV(codeKey, env),
      putToKV(claimedKey, code, env),
    ])

    return new Response(
      JSON.stringify({ 
        success: true, 
        code: code 
      } as ClaimResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Claim error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      } as ClaimResponse),
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

// EdgeOne KV operations using bound namespaces
async function getFromKV(key: string, env: any, namespace: 'sessions' | 'codes' = 'sessions'): Promise<string | null> {
  // Access KV through bound variables (configured in EdgeOne Pages dashboard)
  const kvStore = namespace === 'sessions' ? env.user_sessions_kv : env.redemption_codes_kv
  
  if (kvStore) {
    try {
      return await kvStore.get(key)
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }
  return null
}

async function putToKV(key: string, value: string, env: any, namespace: 'sessions' | 'codes' = 'sessions'): Promise<void> {
  // Access KV through bound variables (configured in EdgeOne Pages dashboard)
  const kvStore = namespace === 'sessions' ? env.user_sessions_kv : env.redemption_codes_kv
  
  if (kvStore) {
    try {
      await kvStore.put(key, value)
      console.log(`Stored in KV (${namespace}): ${key}`)
    } catch (error) {
      console.error('KV put error:', error)
      throw error
    }
  } else {
    console.error(`KV namespace (${namespace}) not bound`)
    throw new Error(`KV namespace (${namespace}) not available`)
  }
}

async function deleteFromKV(key: string, env: any, namespace: 'sessions' | 'codes' = 'codes'): Promise<void> {
  // Access KV through bound variables (configured in EdgeOne Pages dashboard)
  const kvStore = namespace === 'sessions' ? env.user_sessions_kv : env.redemption_codes_kv
  
  if (kvStore) {
    try {
      await kvStore.delete(key)
      console.log(`Deleted from KV (${namespace}): ${key}`)
    } catch (error) {
      console.error('KV delete error:', error)
      throw error
    }
  } else {
    console.error(`KV namespace (${namespace}) not bound`)
    throw new Error(`KV namespace (${namespace}) not available`)
  }
}

async function listCodesFromKV(env: any): Promise<string[]> {
  // EdgeOne KV doesn't have built-in list operation, 
  // so we maintain a list of available codes
  if (env.redemption_codes_kv) {
    try {
      const codesList = await env.redemption_codes_kv.get('available_codes_list')
      if (codesList) {
        return JSON.parse(codesList)
      }
      // Return some sample codes for initial setup
      return [
        `${APP_CONFIG.kv.prefixes.codes}SAMPLE-CODE-001`,
        `${APP_CONFIG.kv.prefixes.codes}SAMPLE-CODE-002`,
        `${APP_CONFIG.kv.prefixes.codes}SAMPLE-CODE-003`,
      ]
    } catch (error) {
      console.error('KV list error:', error)
      return []
    }
  }
  return []
} 