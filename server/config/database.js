const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  'todolist_db',     // 数据库名
  'root',           // 用户名
  'your_password',  // 密码（替换为你的MySQL密码）
  {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    storage: 'C:/xampp/mysql/data/todolist_db' // 添加存储路径
  }
);

// 测试连接
sequelize.authenticate()
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));

module.exports = {
  database: 'todolist_db',
  username: 'root',
  password: 'your_password', // 替换为你的MySQL密码
  host: 'localhost',
  dialect: 'mysql'  // 明确指定使用 mysql
}; 