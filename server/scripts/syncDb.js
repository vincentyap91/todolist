const sequelize = require('../config/database');
const Todo = require('../models/Todo');
const User = require('../models/User');

async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('数据库同步成功');
  } catch (error) {
    console.error('数据库同步失败:', error);
  } finally {
    process.exit();
  }
}

syncDatabase(); 