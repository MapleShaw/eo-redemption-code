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
    console.log('=== LOGIN API DEBUG START ===')
    
    const { userProfile, accessToken } = await request.json()
    
    if (!userProfile || !accessToken) {
      console.log('Missing userProfile or accessToken')
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log('Received user data:', userProfile.username)
    console.log('Access token type:', accessToken.startsWith('ya29') ? 'REAL' : 'UNKNOWN')

    // 验证access token有效性（调用X API验证）
    try {
      const verifyResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!verifyResponse.ok) {
        console.log('Token verification failed')
        return new Response(
          JSON.stringify({ error: 'Invalid access token' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      const verifyData = await verifyResponse.json()
      
      // 确保token对应的用户与提供的用户信息一致
      if (verifyData.data.id !== userProfile.id) {
        console.log('User ID mismatch')
        return new Response(
          JSON.stringify({ error: 'User data mismatch' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      console.log('Token verification successful')
    } catch (verifyError) {
      console.error('Token verification error:', verifyError)
      return new Response(
        JSON.stringify({ error: 'Token verification failed' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // 创建会话
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substr(2, 9)
    const isDev = env.DEV === 'true'
    
    const sessionId = isDev 
      ? `dev_session_${timestamp}_${randomSuffix}`
      : `session_${timestamp}_${randomSuffix}`

    const sessionData = {
      userProfile: {
        id: userProfile.id,
        username: userProfile.username,
        name: userProfile.name,
        profile_image_url: userProfile.profile_image_url
      },
      accessToken: accessToken,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      sessionInfo: {
        userAgent: request.headers.get('User-Agent') || 'Unknown',
        ipAddress: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'Unknown',
        createdAt: new Date().toISOString()
      }
    }

    // 存储会话到KV
    const sessionKey = `user_session:${sessionId}`
    try {
      if (user_sessions_kv) {
        await user_sessions_kv.put(sessionKey, JSON.stringify(sessionData), { expirationTtl: 86400 }) // 24 hours
        console.log('Session stored in KV:', sessionKey)
      } else {
        // 开发环境降级存储
        if (!(global as any).devUserSessions) {
          (global as any).devUserSessions = new Map()
        }
        ;(global as any).devUserSessions.set(sessionKey, JSON.stringify(sessionData))
        console.log('Session stored in dev memory')
      }
    } catch (kvError) {
      console.error('Session storage failed:', kvError)
      return new Response(
        JSON.stringify({ error: 'Session creation failed' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log('Login successful for user:', userProfile.username)
    console.log('=== LOGIN API DEBUG END ===')

    // 返回成功响应，包含会话cookie
    const cookieValue = isDev 
      ? `eo_session=${sessionId}; Path=/; SameSite=Lax; Max-Age=86400`
      : `eo_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`

    return new Response(
      JSON.stringify({ 
        success: true,
        user: sessionData.userProfile
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieValue,
          ...corsHeaders,
        },
      }
    )

  } catch (error) {
    console.error('Login API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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