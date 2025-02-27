// 服务器端配置，不会暴露给客户端
const crypto = require('crypto');

module.exports = {
  // 超级管理员配置
  superAdmin: {
    id: crypto.randomUUID(), // 随机生成ID
    role: 'SUPER_ADMIN',
    accessLevel: 9999,
    // 不要直接存储密码，使用环境变量
    passwordHash: process.env.SUPER_ADMIN_PASSWORD_HASH || 'your-hashed-password'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: '24h'
  },
  
  // 会话配置
  session: {
    secret: crypto.randomBytes(32).toString('hex'),
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}; 