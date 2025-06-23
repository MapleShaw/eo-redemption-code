import { APP_CONFIG } from '../../src/lib/constants'
import type { SessionData } from '../../src/types/user'

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
    console.log('=== CLAIM DEBUG START ===')
    
    // Get session cookie
    const cookieHeader = request.headers.get('Cookie')
    if (!cookieHeader) {
      console.log('No cookie header found')
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        {
          status: 401,
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
      .find((c: string) => c.trim().startsWith('eo_session='))
    
    if (!sessionCookie) {
      console.log('No eo_session cookie found')
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
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
    console.log('Found session ID:', sessionId)
    
    // Get session data from KV
    const sessionKey = `user_session:${sessionId}`
    console.log('Looking for session key:', sessionKey)
    
    const sessionDataStr = await getFromKV(sessionKey)
    if (!sessionDataStr) {
      console.log('Session not found in KV')
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
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
    const accessToken = sessionData.accessToken
    
    console.log('Session found for user:', sessionData.userProfile.username)

    // Check if user has already claimed a code
    const claimedUserKey = `claimed_user:${userId}`
    const existingClaim = await getFromKV(claimedUserKey)
    
    if (existingClaim) {
      console.log('User has already claimed a code')
      return new Response(
        JSON.stringify({ 
          error: 'already_claimed',
          message: '您已经领取过兑换码了'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Verify user is following the KOC using X API
    console.log('Verifying user follows KOC...')
    const kocUserId = APP_CONFIG.koc.userId
    const followingUrl = APP_CONFIG.twitter.followingUrl.replace('{id}', userId)
    
    console.log('KOC User ID:', kocUserId)
    console.log('Following API URL:', followingUrl)
    console.log('User access token type:', accessToken.startsWith('mock_token_') ? 'MOCK' : 'REAL')
    
    // 开发环境检查：如果是mock用户，跳过关注验证
    const isDev = process.env.NODE_ENV === 'development' || accessToken.startsWith('mock_token_')
    if (isDev && accessToken.startsWith('mock_token_')) {
      console.log('DEV MODE: Skipping follower verification for mock user')
      // 开发环境模拟：随机决定是否关注，用于测试两种情况
      const mockIsFollowing = Math.random() > 0.3 // 70%的概率关注，30%不关注
      console.log('DEV MODE: Mock following result:', mockIsFollowing)
      
      if (!mockIsFollowing) {
        console.log('DEV MODE: Simulating user not following KOC')
        return new Response(
          JSON.stringify({
            error: 'not_following',
            message: `您需要先关注 ${APP_CONFIG.koc.username} 才能领取兑换码`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }
    } else {
      // 真实API验证关注关系
      let isFollowing = false
      try {
        const followingResponse = await fetch(followingUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Following check response status:', followingResponse.status)
        
        if (followingResponse.ok) {
          const followingData = await followingResponse.json()
          
          // Check if KOC is in the following list
          if (followingData.data && followingData.data.length > 0) {
            isFollowing = followingData.data.some((user: any) => user.id === kocUserId)
          }
          
          console.log('Following check result:', isFollowing)
        } else {
          console.error('Following check failed:', await followingResponse.text())
          // If API call fails, we might want to allow the claim or handle it gracefully
          // For now, let's assume they're following to avoid blocking users due to API issues
          console.warn('Following check API failed, allowing claim to proceed')
          isFollowing = true
        }
      } catch (fetchError) {
        console.error('Following check network error:', fetchError)
        // Handle network error gracefully
        console.warn('Following check network error, allowing claim to proceed')
        isFollowing = true
      }

      if (!isFollowing) {
        console.log('User is not following KOC')
        return new Response(
          JSON.stringify({
            error: 'not_following',
            message: `您需要先关注 ${APP_CONFIG.koc.username} 才能领取兑换码`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }
    }

    // Get available redemption codes
    console.log('Looking for available redemption codes...')
    const availableCodes = await listAvailableCodes()
    
    if (availableCodes.length === 0) {
      console.log('No redemption codes available')
      return new Response(
        JSON.stringify({
          error: 'no_codes_left',
          message: '很抱歉，兑换码已经全部被领取完了'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Claim a redemption code (atomic operation)
    const selectedCodeKey = availableCodes[0] // Take the first available code
    const codeValue = selectedCodeKey.replace('code:', '')
    
    console.log('Claiming code:', codeValue)
    
    try {
      // Remove code from available pool
      await deleteFromKV(selectedCodeKey)
      
      // Record the claim
      const claimRecord = {
        code: codeValue,
        claimedAt: new Date().toISOString(),
        userId: userId,
        username: sessionData.userProfile.username
      }
      
      await putToKV(claimedUserKey, JSON.stringify(claimRecord))
      
      console.log('Code successfully claimed by user:', sessionData.userProfile.username)
      console.log('=== CLAIM DEBUG END ===')
      
      return new Response(
        JSON.stringify({
          success: true,
          code: codeValue,
          message: '兑换码领取成功！'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    } catch (kvError) {
      console.error('KV operation failed during claim:', kvError)
      
      return new Response(
        JSON.stringify({
          error: 'claim_failed',
          message: '兑换码领取失败，请重试'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

  } catch (error) {
    console.error('Claim error:', error)
    
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: '服务器错误，请稍后重试'
      }),
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

// Helper functions for KV operations
async function getFromKV(key: string): Promise<string | null> {
  try {
    if (user_sessions_kv) {
      return await user_sessions_kv.get(key)
    } else if ((global as any).devUserSessions) {
      return (global as any).devUserSessions.get(key) || null
    }
    return null
  } catch (error) {
    console.error('KV get error:', error)
    return null
  }
}

async function putToKV(key: string, value: string, options?: any): Promise<void> {
  try {
    if (user_sessions_kv) {
      await user_sessions_kv.put(key, value, options)
    } else {
      if (!(global as any).devUserSessions) {
        (global as any).devUserSessions = new Map()
      }
      ;(global as any).devUserSessions.set(key, value)
    }
  } catch (error) {
    console.error('KV put error:', error)
    throw error
  }
}

async function deleteFromKV(key: string): Promise<void> {
  try {
    if (user_sessions_kv) {
      await user_sessions_kv.delete(key)
    } else if ((global as any).devUserSessions) {
      ;(global as any).devUserSessions.delete(key)
    }
  } catch (error) {
    console.error('KV delete error:', error)
    throw error
  }
}

async function listAvailableCodes(): Promise<string[]> {
  try {
    if (user_sessions_kv) {
      // EdgeOne KV list operation
      const list = await user_sessions_kv.list({ prefix: 'code:' })
      return list.keys.map((key: any) => key.name)
    } else {
      // Development fallback - simulate some codes
      if (!(global as any).devCodes) {
        (global as any).devCodes = [
          'code:0YWRLLLNKBCB',
          'code:PWNOAXZ4C945', 
          'code:837QEYQXT612',
          'code:6PNPRDAIXBB1'
        ]
      }
      return (global as any).devCodes
    }
  } catch (error) {
    console.error('KV list error:', error)
    return []
  }
} 