const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const User = require('../models/User');

async function initializeUsers() {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    
    // 创建 admin 用户
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: adminPassword,
      email: 'admin@example.com',
      role: 'admin',
      status: 'active'
    }, {
      ignoreDuplicates: true
    });

    // 创建 vincent 用户
    const vincentPassword = await bcrypt.hash('vincent123', 10);
    await User.create({
      username: 'vincent',
      password: vincentPassword,
      email: 'vincent@example.com',
      role: 'admin',
      status: 'active'
    }, {
      ignoreDuplicates: true
    });

    console.log('用户初始化成功');
  } catch (error) {
    console.error('用户初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行初始化
initializeUsers(); 