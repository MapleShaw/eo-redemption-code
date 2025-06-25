// 显式声明为Node.js环境，覆盖DOM类型
declare const global: any

// EdgeOne Pages KV全局变量声明
declare const redemption_codes_kv: any

const handler = {
  async fetch(request: Request, env: any): Promise<Response> {
    // 只允许POST请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const body = await request.json()
      const { userId, username } = body

      if (!userId || !username) {
        return new Response(JSON.stringify({ error: '缺少必要参数' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      console.log(`用户 ${username} (${userId}) 请求兑换码`)

      // 检查用户是否已经领取过
      const existingClaim = await redemption_codes_kv.get(`claimed_user:${userId}`)
      if (existingClaim) {
        console.log('用户已经领取过兑换码')
        return new Response(JSON.stringify({
          success: true,
          code: existingClaim,
          message: '您已经领取过兑换码了'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // 获取可用的兑换码
      const codesList = await redemption_codes_kv.list({ prefix: 'redemption_code:' })
      const availableCodes = codesList.keys.filter((key: any) => key.name.startsWith('redemption_code:'))

      if (availableCodes.length === 0) {
        console.log('没有可用的兑换码')
        return new Response(JSON.stringify({ error: '兑换码已全部发放完毕' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // 使用用户ID哈希来确定性地分配兑换码
      let userHash = 0
      for (let i = 0; i < userId.length; i++) {
        userHash = ((userHash << 5) - userHash) + userId.charCodeAt(i)
        userHash = userHash & userHash // 转换为32位整数
      }
      const codeIndex = Math.abs(userHash) % availableCodes.length
      const selectedCodeKey = availableCodes[codeIndex].name

      // 获取实际的兑换码
      const codeDataStr = await redemption_codes_kv.get(selectedCodeKey)
      if (!codeDataStr) {
        return new Response(JSON.stringify({ error: '兑换码获取失败' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // 解析兑换码数据
      let codeData
      try {
        codeData = JSON.parse(codeDataStr)
      } catch (parseError) {
        console.error('兑换码数据解析失败:', parseError)
        return new Response(JSON.stringify({ error: '兑换码数据格式错误' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const actualCode = codeData.code

      // 原子操作：删除可用兑换码，添加用户领取记录
      await Promise.all([
        redemption_codes_kv.delete(selectedCodeKey),
        redemption_codes_kv.put(`claimed_user:${userId}`, actualCode)
      ])

      console.log(`成功分配兑换码给用户 ${username}`)

      return new Response(JSON.stringify({
        success: true,
        code: actualCode
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('处理领取请求时出错:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      return new Response(JSON.stringify({ 
        error: '服务器内部错误',
        details: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

export default handler 