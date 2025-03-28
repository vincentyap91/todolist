const sequelize = require('../config/database');
const User = require('../models/User');
const Todo = require('../models/Todo');

async function resetDatabase() {
  try {
    // 测试连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 定义关联
    Todo.belongsTo(User);
    User.hasMany(Todo);

    // 强制重新创建所有表
    await sequelize.sync({ force: true });
    console.log('数据库重置成功');

    process.exit(0);
  } catch (error) {
    console.error('数据库重置失败:', error);
    process.exit(1);
  }
}

resetDatabase(); 