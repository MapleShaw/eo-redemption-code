import type { SessionData, ClaimResponse } from '../../src/types/user'
import { APP_CONFIG } from '../../src/lib/constants'

interface EdgeOneContext {
  request: Request
  env: {
    [key: string]: string | undefined
  }
  params: Record<string, string>
}

/**
 * 简化版兑换码领取 - 无需关注验证
 * 降低 API 使用量，适用于免费 X API 层级
 */
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
    const sessionDataStr = await getFromKV(sessionKey, env, 'sessions')
    
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
    const alreadyClaimed = await getFromKV(claimedKey, env, 'codes')
    
    if (alreadyClaimed) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          code: alreadyClaimed,
          message: 'You have already claimed your code'
        } as ClaimResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // 🚀 简化版本：跳过关注验证，直接分配兑换码
    console.log(`User ${userId} (${sessionData.userProfile.username}) claiming code - no follow check required`)

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
      deleteFromKV(codeKey, env, 'codes'),
      putToKV(claimedKey, code, env, 'codes'),
      // Update available codes list
      updateAvailableCodesList(availableCodes.slice(1), env)
    ])

    console.log(`Code ${code} claimed by user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        code: code,
        message: 'Code claimed successfully!'
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
  if (env.redemption_codes_kv) {
    try {
      const codesList = await env.redemption_codes_kv.get('available_codes_list')
      if (codesList) {
        return JSON.parse(codesList)
      }
      // Return some sample codes for initial setup
      return [
        `${APP_CONFIG.kv.prefixes.codes}WELCOME2024`,
        `${APP_CONFIG.kv.prefixes.codes}SPECIAL001`,
        `${APP_CONFIG.kv.prefixes.codes}EXCLUSIVE99`,
      ]
    } catch (error) {
      console.error('KV list error:', error)
      return []
    }
  }
  return []
}

async function updateAvailableCodesList(newList: string[], env: any): Promise<void> {
  if (env.redemption_codes_kv) {
    try {
      await env.redemption_codes_kv.put('available_codes_list', JSON.stringify(newList))
      console.log(`Updated available codes list, ${newList.length} codes remaining`)
    } catch (error) {
      console.error('Error updating codes list:', error)
      throw error
    }
  }
} 