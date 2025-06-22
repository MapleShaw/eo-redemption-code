/**
 * 批量录入兑换码到 EdgeOne Pages KV
 * 运行方式：node scripts/seed-redemption-codes.js
 */

const codes = [
  '0YWRLLLNKBCB',
  'PWNOAXZ4C945', 
  '837QEYQXT612',
  '6PNPRDAIXBB1'
]

async function seedRedemptionCodes() {
  console.log('开始录入兑换码...')
  
  // 模拟KV存储结构（用于开发环境测试）
  const redemptionCodesData = {}
  
  for (const code of codes) {
    const codeData = {
      code: code,
      isUsed: false,
      createdAt: new Date().toISOString(),
      usedAt: null,
      usedBy: null
    }
    
    redemptionCodesData[`redemption_code:${code}`] = JSON.stringify(codeData)
    console.log(`✅ 录入兑换码: ${code}`)
  }
  
  console.log('\n📝 KV存储结构:')
  console.log(JSON.stringify(redemptionCodesData, null, 2))
  
  console.log('\n💡 注意:')
  console.log('1. 这个脚本生成了KV存储的数据结构')
  console.log('2. 在生产环境中，这些数据会存储到EdgeOne Pages KV中')
  console.log('3. 开发环境中，我们需要在代码中模拟这些数据')
  
  console.log('\n🔧 下一步:')
  console.log('1. 将这些数据加入到开发环境的模拟KV中')
  console.log('2. 或者在EdgeOne Pages控制台手动添加这些KV条目')
}

seedRedemptionCodes().catch(console.error)
