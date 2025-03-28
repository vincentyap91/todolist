const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

// 创建 Express 应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 创建数据库连接
const db = new Sequelize(
  process.env.DB_NAME || 'todolist_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

// 定义模型
const User = db.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  }
});

const Todo = db.define('Todo', {
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  UserId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    },
    allowNull: false
  }
});

// 设置关联关系 - 但不添加外键（因为已经手动定义）
Todo.belongsTo(User, { foreignKey: 'UserId', constraints: false });
User.hasMany(Todo, { foreignKey: 'UserId', constraints: false });

// JWT验证中间件
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('收到的 token:', token); // 添加调试日志
    
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('解码后的 token:', decoded); // 添加调试日志
    
    const user = await User.findOne({ 
      where: { id: decoded.id },
      attributes: ['id', 'username', 'role', 'status']
    });
    
    console.log('找到的用户:', user ? user.username : '未找到'); // 添加调试日志

    if (!user) {
      return res.status(403).json({ message: '用户不存在' });
    }

    // 检查用户状态
    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({ message: '账号待审核，请联系管理员' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(403).json({ message: '无效的认证令牌' });
  }
};

// 初始化数据库
const initializeDatabase = async () => {
  try {
    await db.authenticate();
    console.log('数据库连接成功');

    // 使用 force: false 和 alter: false 避免修改表结构
    await db.sync({ force: false, alter: false });
    console.log('数据库同步完成');

    // 检查是否存在超级管理员
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      console.log('超级管理员创建成功');
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    // 不要退出进程，让服务器继续运行
    console.log('尝试继续启动服务器...');
  }
};

// 路由定义
// 登录路由
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 检查用户状态，只有管理员和激活状态的用户可以登录
    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({ message: '账号待审核，请联系管理员' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 获取用户列表路由
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限访问此页面' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 获取任务列表路由
app.get('/api/todos', verifyToken, async (req, res) => {
  try {
    console.log('获取用户任务: 用户ID =', req.user.id);
    
    const todos = await Todo.findAll({
      where: { UserId: req.user.id },
      order: [['order', 'ASC']] // 明确按 order 字段排序
    });
    
    console.log(`找到 ${todos.length} 个任务，按顺序排列:`, 
      todos.map(t => ({ id: t.id, text: t.text.substring(0, 10) + '...', order: t.order }))
    );
    
    res.json(todos);
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ message: '获取任务失败', error: error.message });
  }
});

// 添加任务路由
app.post('/api/todos', verifyToken, async (req, res) => {
  try {
    const { text, order } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: '任务内容不能为空' });
    }
    
    let taskOrder = order;
    
    // 如果没有提供顺序，则获取用户现有任务的最大顺序值并加1
    if (taskOrder === undefined) {
      const maxOrderTask = await Todo.findOne({
        where: { UserId: req.user.id },
        order: [['order', 'DESC']]
      });
      
      taskOrder = maxOrderTask ? maxOrderTask.order + 1 : 0;
    }
    
    console.log(`添加新任务，用户ID: ${req.user.id}, 文本: ${text}, 顺序: ${taskOrder}`);
    
    const todo = await Todo.create({
      text,
      completed: false,
      order: taskOrder,
      UserId: req.user.id
    });
    
    res.status(201).json(todo);
  } catch (error) {
    console.error('添加任务失败:', error);
    res.status(500).json({ message: '添加任务失败', error: error.message });
  }
});

// 更新任务路由
app.put('/api/todos/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('更新任务请求:', { id, body: req.body, user: req.user.id }); // 添加调试日志
    
    const { text, completed } = req.body;
    
    // 查找任务
    const todo = await Todo.findOne({
      where: { id, UserId: req.user.id }
    });
    
    if (!todo) {
      console.log('任务不存在或不属于当前用户'); // 添加调试日志
      return res.status(404).json({ message: '任务不存在或不属于当前用户' });
    }
    
    // 记录更新前的任务状态
    console.log('更新前的任务:', todo.toJSON()); // 添加调试日志
    
    // 更新任务
    if (text !== undefined) todo.text = text.trim();
    if (completed !== undefined) todo.completed = completed;
    
    await todo.save();
    
    // 记录更新后的任务状态
    console.log('更新后的任务:', todo.toJSON()); // 添加调试日志
    
    res.json(todo);
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ message: '更新任务失败', error: error.message });
  }
});

// 添加删除任务的路由
app.delete('/api/todos/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const todo = await Todo.findOne({
      where: { id, UserId: req.user.id }
    });
    
    if (!todo) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    await todo.destroy();
    
    res.json({ message: '任务已删除' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ message: '删除任务失败' });
  }
});

// 重新排序任务路由 - 使用逐条更新方式
app.post('/api/todos/reorder', verifyToken, async (req, res) => {
  let transaction;
  
  try {
    const { todoIds } = req.body;
    console.log('接收到重排序请求:', todoIds);
    console.log('当前用户ID:', req.user.id);
    
    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      console.error('无效的任务ID列表');
      return res.status(400).json({ message: '无效的任务ID列表' });
    }
    
    // 验证所有任务都属于当前用户
    const todos = await Todo.findAll({
      where: { 
        id: todoIds,
        UserId: req.user.id
      }
    });
    
    console.log(`找到 ${todos.length} 个任务，请求中有 ${todoIds.length} 个任务`);
    console.log('找到的任务:', todos.map(t => ({ id: t.id, order: t.order })));
    
    if (todos.length !== todoIds.length) {
      console.error('任务验证失败:', {
        found: todos.length,
        requested: todoIds.length,
        foundIds: todos.map(t => t.id)
      });
      return res.status(403).json({ 
        message: '无权重新排序某些任务',
        found: todos.length,
        requested: todoIds.length,
        foundIds: todos.map(t => t.id)
      });
    }
    
    // 开始事务
    transaction = await db.transaction();
    console.log('事务已开始');
    
    // 逐个更新任务顺序
    for (let i = 0; i < todoIds.length; i++) {
      const [updatedRowsCount] = await Todo.update(
        { order: i },
        { 
          where: { 
            id: todoIds[i],
            UserId: req.user.id
          },
          transaction
        }
      );
      
      console.log(`更新任务 ID:${todoIds[i]} 的顺序为 ${i}, 更新的行数: ${updatedRowsCount}`);
    }
    
    // 提交事务
    await transaction.commit();
    console.log('事务已提交');
    
    // 获取更新后的任务列表
    const updatedTodos = await Todo.findAll({
      where: { UserId: req.user.id },
      order: [['order', 'ASC']]
    });
    
    console.log('更新后的任务顺序:', updatedTodos.map(t => ({ id: t.id, order: t.order })));
    
    // 返回已排序的任务列表
    res.json(updatedTodos);
  } catch (error) {
    // 回滚事务
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('事务已回滚');
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError);
      }
    }
    console.error('重排序任务失败:', error);
    res.status(500).json({ message: '重排序任务失败', error: error.message });
  }
});

// 更新用户状态路由
app.put('/api/users/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending'].includes(status)) {
      return res.status(400).json({ message: '无效的状态值' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 防止修改管理员状态
    if (user.role === 'admin' && user.id !== req.user.id) {
      return res.status(403).json({ message: '不能修改其他管理员的状态' });
    }

    user.status = status;
    await user.save();

    res.json({ message: '用户状态已更新', user: {
      id: user.id,
        username: user.username,
      role: user.role,
      status: user.status
    }});
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ message: '更新用户状态失败' });
  }
});

// 更新用户信息路由
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }

    const { id } = req.params;
    const { email, role, status } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 防止修改其他管理员的角色
    if (user.role === 'admin' && user.id !== req.user.id && role !== 'admin') {
      return res.status(403).json({ message: '不能降级其他管理员的角色' });
    }

    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json({ message: '用户信息已更新', user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    }});
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  }
});

// 修改用户密码路由
app.put('/api/users/:id/password', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6个字符' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: '密码已修改' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ message: '修改密码失败' });
  }
});

// 调试接口 - 检查任务排序状态
app.get('/api/debug/todos', verifyToken, async (req, res) => {
  try {
    console.log('调试任务排序: 用户ID =', req.user.id);
    
    // 按 ID 排序获取任务
    const todosByID = await Todo.findAll({
      where: { UserId: req.user.id },
      order: [['id', 'ASC']]
    });
    
    // 按 order 排序获取任务
    const todosByOrder = await Todo.findAll({
      where: { UserId: req.user.id },
      order: [['order', 'ASC']]
    });
    
    // 检查数据库中的表结构
    const tableInfo = await db.getQueryInterface().describeTable('Todos');
    
    // 返回诊断信息
    res.json({
      todoCount: todosByID.length,
      tableStructure: tableInfo,
      byID: todosByID.map(t => ({ id: t.id, text: t.text.substring(0, 15), order: t.order })),
      byOrder: todosByOrder.map(t => ({ id: t.id, text: t.text.substring(0, 15), order: t.order }))
    });
  } catch (error) {
    console.error('获取调试信息失败:', error);
    res.status(500).json({ message: '获取调试信息失败', error: error.message });
  }
});

// 如果您使用了直接在 server.js 中定义路由的方式
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }
    
    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'pending'
    });
    
    res.status(201).json({ 
      message: '注册成功，等待管理员审核', 
      userId: newUser.id 
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败，请重试' });
  }
});

// 或者如果您使用了路由模块
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 启动服务器
const PORT = process.env.PORT || 5000;

// 初始化数据库并启动服务器
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
});
