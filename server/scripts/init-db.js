const sequelize = require('../config/database');
const User = require('../models/User');
const Todo = require('../models/Todo');

async function initializeDatabase() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步所有模型
    await sequelize.sync({ force: true });
    console.log('数据库表创建成功');

  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initializeDatabase(); 