/**
 * 初始化兑换码到KV的EdgeOne Function
 * 访问: /init-codes 来执行初始化
 */

// EdgeOne Pages KV全局变量声明
declare global {
  var redemption_codes_kv: any
}

const codes = [
  '0YWRLLLNKBCB',
  'PWNOAXZ4C945', 
  '837QEYQXT612',
  '6PNPRDAIXBB1'
]

export async function onRequest(context: any): Promise<Response> {
  const { request } = context
  
  console.log('=== INIT CODES DEBUG ===')
  console.log('- Method:', request.method)
  console.log('- redemption_codes_kv type:', typeof redemption_codes_kv)
  console.log('- redemption_codes_kv available:', redemption_codes_kv ? 'YES' : 'NO')
  
  // 只允许GET请求
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }
  
  try {
    console.log('开始初始化兑换码到KV...')
    
    // 检查KV是否可用
    if (!redemption_codes_kv) {
      console.error('redemption_codes_kv not available!')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'redemption_codes_kv not available' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const codeKeys = []
    const results = []
    
    // 逐个存储兑换码
    for (const code of codes) {
      const codeKey = `redemption_code:${code}`
      const codeData = {
        code: code,
        isUsed: false,
        createdAt: new Date().toISOString(),
        usedAt: null,
        usedBy: null
      }
      
      try {
        console.log(`正在存储兑换码: ${code}`)
        await redemption_codes_kv.put(codeKey, JSON.stringify(codeData))
        console.log(`✅ 已存储兑换码: ${code}`)
        codeKeys.push(codeKey)
        results.push({ code, status: 'success' })
      } catch (error) {
        console.error(`❌ 存储兑换码失败 ${code}:`, error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        results.push({ code, status: 'failed', error: errorMessage })
      }
    }
    
    // 存储可用兑换码列表
    let listStored = false
    try {
      console.log('正在存储可用兑换码列表...')
      await redemption_codes_kv.put('available_codes_list', JSON.stringify(codeKeys))
      console.log(`✅ 已存储可用兑换码列表，共${codeKeys.length}个`)
      listStored = true
    } catch (error) {
      console.error('❌ 存储兑换码列表失败:', error)
    }
    
    console.log('初始化完成！')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '兑换码初始化完成',
        codesInitialized: codeKeys.length,
        totalCodes: codes.length,
        listStored,
        details: results
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('初始化过程中出错:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: errorStack 
      }, null, 2),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
