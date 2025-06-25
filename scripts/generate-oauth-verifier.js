#!/usr/bin/env node

/**
 * 生成 OAuth 2.0 PKCE Code Verifier
 * 用法: node scripts/generate-oauth-verifier.js
 */

const crypto = require('crypto')

console.log('🔐 生成 OAuth Code Verifier...\n')

// 根据 RFC 7636 规范生成 code verifier
// 长度: 43-128 个字符
// 字符集: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
function generateCodeVerifier() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const length = 128 // 使用最大长度以获得最高安全性
  let result = ''
  
  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % charset.length]
  }
  
  return result
}

// 生成 code challenge (用于验证)
async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256')
  hash.update(verifier)
  const digest = hash.digest()
  
  // 转换为 base64url 格式
  return digest
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function main() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  
  console.log('✅ 已生成 OAuth Code Verifier:')
  console.log(`OAUTH_CODE_VERIFIER=${verifier}`)
  console.log('')
  console.log('🔍 对应的 Code Challenge (用于验证):')
  console.log(`Code Challenge: ${challenge}`)
  console.log('Challenge Method: S256')
  console.log('')
  console.log('📋 将 OAUTH_CODE_VERIFIER 复制到你的环境变量中')
  console.log('⚠️  注意: 每个环境使用不同的 verifier!')
  console.log('')
  console.log('📖 说明:')
  console.log('- 开发环境: code verifier 从前端 state 动态获取')
  console.log('- 生产环境: 使用固定的 OAUTH_CODE_VERIFIER 环境变量')
}

main().catch(console.error) 