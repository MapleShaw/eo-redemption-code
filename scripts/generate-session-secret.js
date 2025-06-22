#!/usr/bin/env node

/**
 * 生成安全的会话密钥
 * 用法: node scripts/generate-session-secret.js
 */

const crypto = require('crypto')

console.log('🔐 生成会话密钥...\n')

// 生成 32 字节的随机密钥 (256 位)
const sessionSecret = crypto.randomBytes(32).toString('hex')

console.log('✅ 已生成安全的会话密钥:')
console.log(`SESSION_SECRET=${sessionSecret}`)
console.log('\n📋 请将上面的密钥复制到你的 .env 文件中')
console.log('⚠️  注意: 生产环境请使用不同的密钥!') 