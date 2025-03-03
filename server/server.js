const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const superAdminConfig = require('./config/superAdmin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const authConfig = require('./config/auth.config');
const { verifyToken, isSuperAdmin } = require('./middleware/auth.middleware');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 5000;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'https://vincentyap91.github.io'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// 限制请求速率
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100个请求
});
app.use(limiter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: '服务器错误' });
});

// 确保在路由之前添加这些头部
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// 添加 todos 数据文件路径
const TODOS_FILE = path.join(__dirname, 'data', 'todos.json');

// 确保在服务器启动时创建 data 目录
const DATA_DIR = path.join(__dirname, 'data');
try {
  // 确保 data 目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }

  // 检查 users.json 文件
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(USERS_FILE)) {
    // 创建默认管理员账户
    const defaultAdmin = {
      users: {
        admin: {
          username: 'admin',
          password: bcrypt.hashSync('admin123', 10),
          role: 'SUPER_ADMIN',
          isApproved: true,
          createdAt: new Date().toISOString()
        }
      }
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultAdmin, null, 2));
    console.log('Created default admin user');
  }

  // 测试文件读写权限
  fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
  fs.accessSync(USERS_FILE, fs.constants.R_OK | fs.constants.W_OK);
  console.log('File permissions verified');
} catch (error) {
  console.error('File system error:', error);
  process.exit(1);
}

// 确保数据文件和目录存在
const initDataFile = () => {
  try {
    // 确保 data 目录存在
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
      fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    }
    
    // 确保 users.json 文件存在
    if (!fs.existsSync(DATA_FILE)) {
      const initialData = {
        approvedUsers: [],
        pendingUsers: [],
        lastUpdate: new Date().toISOString(),
        todos: {}
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }

    // 验证文件内容
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    JSON.parse(data); // 确保是有效的 JSON
  } catch (error) {
    console.error('Error initializing data file:', error);
    // 如果出错，创建新的文件
    const initialData = {
      approvedUsers: [],
      pendingUsers: [],
      lastUpdate: new Date().toISOString(),
      todos: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
};

// 初始化数据文件
initDataFile();

// 读取用户数据
const readUsers = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // 创建默认的超级管理员账户
      const defaultPassword = 'admin123';
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(defaultPassword, salt);

      const defaultData = {
        users: {
          admin: {
            username: 'admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            createdAt: new Date().toISOString(),
            isApproved: true
          }
        }
      };

      // 确保 data 目录存在
      if (!fs.existsSync(path.dirname(DATA_FILE))) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData.users;
    }

    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.users || {};
  } catch (error) {
    console.error('Error reading users file:', error);
    return {};
  }
};

// 写入用户数据
const writeUsers = (users) => {
  try {
    const data = { users };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

// 读取待办事项数据
const readTodos = () => {
  try {
    if (!fs.existsSync(TODOS_FILE)) {
      fs.writeFileSync(TODOS_FILE, JSON.stringify({ todos: {} }, null, 2));
      return {};
    }
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data).todos || {};
  } catch (error) {
    console.error('Error reading todos file:', error);
    return {};
  }
};

// 写入待办事项数据
const writeTodos = (todos) => {
  try {
    if (!fs.existsSync(path.dirname(TODOS_FILE))) {
      fs.mkdirSync(path.dirname(TODOS_FILE), { recursive: true });
    }
    fs.writeFileSync(TODOS_FILE, JSON.stringify({ todos }, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing todos file:', error);
    return false;
  }
};

// 获取超级管理员的待办事项
const getSuperAdminTodos = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'superadmin_todos.json'), 'utf8');
    return JSON.parse(data).todos || [];
  } catch (error) {
    return [];
  }
};

// 保存超级管理员的待办事项
const saveSuperAdminTodos = (todos) => {
  try {
    fs.writeFileSync(
      path.join(__dirname, 'data', 'superadmin_todos.json'),
      JSON.stringify({ todos }, null, 2)
    );
    return true;
  } catch (error) {
    console.error('Error saving superadmin todos:', error);
    return false;
  }
};

// JWT 密钥
const SECRET_KEY = 'your-secret-key'; // 建议使用环境变量

// 添加在线用户跟踪
const onlineUsers = new Set();

// 初始化超级管理员
const initSuperAdmin = async () => {
  console.log('Initializing super admin...'); // 添加日志
  const users = readUsers();
  if (!users.vincent) {
    console.log('Creating super admin account'); // 添加日志
    const hashedPassword = await bcrypt.hash('vincent123', 10);
    users.vincent = {
      username: 'vincent',
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    };
    writeUsers(users);
    console.log('Super admin initialized successfully'); // 添加日志
  } else {
    console.log('Super admin already exists'); // 添加日志
  }
};

// 初始化数据
initSuperAdmin().catch(console.error);

// 登录路由
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    // 确保用户文件存在
    if (!fs.existsSync(DATA_FILE)) {
      // 创建默认管理员账户
      const defaultAdmin = {
        users: {
          admin: {
            username: 'admin',
            password: await bcrypt.hash('admin123', 10),
            role: 'SUPER_ADMIN',
            isApproved: true,
            createdAt: new Date().toISOString()
          }
        }
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultAdmin, null, 2));
    }

    // 读取用户数据
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const { users } = JSON.parse(data);
    const user = users[username];

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 检查用户是否已审核（超级管理员除外）
    if (user.role !== 'SUPER_ADMIN' && !user.isApproved) {
      return res.status(401).json({ message: '账户待审核' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        username: user.username,
        role: user.role 
      },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    // 添加到在线用户列表
    onlineUsers.add(username);
    console.log('User logged in successfully:', username);
    console.log('Current online users:', Array.from(onlineUsers));

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败：' + error.message });
  }
});

// 修改登出路由
app.post('/api/logout', verifyToken, (req, res) => {
  try {
    const username = req.user.username;
    // 从在线用户集合中移除
    onlineUsers.delete(username);
    console.log(`User ${username} logged out. Online users:`, Array.from(onlineUsers));
    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: '登出失败' });
  }
});

// 修改注册路由
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body); // 添加日志
    const { username, password } = req.body;

    // 输入验证
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: '用户名至少需要3个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要6个字符' });
    }

    const users = readUsers();
    console.log('Current users:', Object.keys(users)); // 添加日志

    if (users[username]) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      password: hashedPassword,
      role: 'USER',
      createdAt: new Date().toISOString(),
      isApproved: false
    };

    users[username] = newUser;
    
    // 写入新用户数据
    const success = writeUsers(users);
    if (!success) {
      throw new Error('Failed to write user data');
    }

    console.log('Registration successful for:', username); // 添加日志
    res.status(201).json({ 
      message: '注册成功，请等待管理员审核',
      user: {
        username,
        role: 'USER',
        isApproved: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败：' + error.message });
  }
});

// 获取用户信息
app.get('/api/user/profile', verifyToken, (req, res) => {
  const user = readUsers()[req.user.username];
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  res.json({
    username: user.username,
    role: user.role
  });
});

// 确保在其他路由之前添加这些新路由
app.get('/api/admin/check', verifyToken, (req, res) => {
  try {
    const users = readUsers();
    const user = users[req.user.username];

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: '无权限访问' });
    }

    res.json({ message: '验证成功' });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: '验证失败' });
  }
});

// 修改获取用户列表路由
app.get('/api/admin/users', verifyToken, (req, res) => {
  try {
    const users = readUsers();
    const adminUser = users[req.user.username];

    if (!adminUser || adminUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: '无权限访问' });
    }

    const safeUsers = Object.entries(users).map(([username, user]) => ({
      username,
      role: user.role,
      isApproved: user.role === 'SUPER_ADMIN' ? true : (user.isApproved || false),
      createdAt: user.createdAt || new Date().toISOString(),
      isOnline: onlineUsers.has(username)
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 更新用户信息（仅限超级管理员）
app.put('/api/admin/users/:username', verifyToken, async (req, res) => {
  try {
    const users = readUsers();
    const adminUser = users[req.user.username];

    if (!adminUser || adminUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: '无权限操作' });
    }

    const { username } = req.params;
    const { password, isApproved } = req.body;
    const user = users[username];

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: '不能修改超级管理员' });
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (typeof isApproved === 'boolean') {
      user.isApproved = isApproved;
    }

    writeUsers(users);
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: '更新失败' });
  }
});

// 删除用户（仅限超级管理员）
app.delete('/api/admin/users/:username', verifyToken, async (req, res) => {
  try {
    const users = readUsers();
    const adminUser = users[req.user.username];

    if (adminUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: '权限不足' });
    }

    const { username } = req.params;
    if (username === 'vincent') {
      return res.status(400).json({ message: '不能删除超级管理员账户' });
    }

    delete users[username];
    writeUsers(users);

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
});

// 获取用户的待办事项
app.get('/api/todos', verifyToken, (req, res) => {
  try {
    const username = req.user.username;
    const todosPath = path.join(__dirname, 'data', `${username}_todos.json`);
    
    // 如果文件不存在，返回空数组
    if (!fs.existsSync(todosPath)) {
      return res.json([]);
    }

    const data = fs.readFileSync(todosPath, 'utf8');
    const todos = JSON.parse(data);
    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: '获取待办事项失败' });
  }
});

// 添加待办事项
app.post('/api/todos', verifyToken, (req, res) => {
  try {
    const { text } = req.body;
    const username = req.user.username;
    const todosPath = path.join(__dirname, 'data', `${username}_todos.json`);
    
    // 如果文件不存在，创建一个空的待办事项列表
    let todos = [];
    if (fs.existsSync(todosPath)) {
      const data = fs.readFileSync(todosPath, 'utf8');
      todos = JSON.parse(data);
    }

    // 添加新的待办事项
    const newTodo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    fs.writeFileSync(todosPath, JSON.stringify(todos, null, 2));
    
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Add todo error:', error);
    res.status(500).json({ message: '添加待办事项失败' });
  }
});

// 更新待办事项
app.put('/api/todos/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;
    const todos = readTodos();
    const userTodos = todos[req.user.username] || [];
    
    const todoIndex = userTodos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      return res.status(404).json({ message: '待办事项不存在' });
    }

    userTodos[todoIndex] = {
      ...userTodos[todoIndex],
      text: text !== undefined ? text : userTodos[todoIndex].text,
      completed: completed !== undefined ? completed : userTodos[todoIndex].completed
    };

    todos[req.user.username] = userTodos;
    writeTodos(todos);

    res.json(userTodos[todoIndex]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: '更新待办事项失败' });
  }
});

// 删除待办事项
app.delete('/api/todos/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const todos = readTodos();
    const userTodos = todos[req.user.username] || [];
    
    const todoIndex = userTodos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      return res.status(404).json({ message: '待办事项不存在' });
    }

    userTodos.splice(todoIndex, 1);
    todos[req.user.username] = userTodos;
    writeTodos(todos);

    res.json({ message: '待办事项删除成功' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: '删除待办事项失败' });
  }
});

// API 路由
app.get('/api/users', (req, res) => {
  try {
    const data = readUsers();
    res.json(data);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: '获取用户数据失败' });
  }
});

app.get('/api/users/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('Getting user with identifier:', identifier); // 调试日志
    
    const data = readUsers();
    const user = data.approvedUsers.find(u => 
      u.email === identifier || 
      u.username === identifier
    );
    
    console.log('Found user:', user); // 调试日志
    
    // 检查是否是超级管理员
    if (identifier === superAdminConfig.email) {
      const { password, ...safeAdminData } = superAdminConfig;
      res.json(safeAdminData);
      return;
    }
    
    if (user) {
      res.json(user);
    } else {
      console.log('User not found'); // 调试日志
      res.status(404).json({ message: '用户不存在' });
    }
  } catch (error) {
    console.error('Error in get user route:', error);
    res.status(500).json({ message: '获取用户数据失败' });
  }
});

app.post('/api/users/pending', (req, res) => {
  try {
    const userData = req.body;
    const data = readUsers();
    
    const emailExists = [...data.approvedUsers, ...data.pendingUsers]
      .some(u => u.email === userData.email);
    
    if (emailExists) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }
    
    const newUser = {
      ...userData,
      status: 'pending',
      registeredAt: new Date().toISOString()
    };
    
    data.pendingUsers.push(newUser);
    
    if (writeUsers(data)) {
      res.status(201).json(newUser);
    } else {
      res.status(500).json({ message: '保存失败' });
    }
  } catch (error) {
    console.error('Error adding pending user:', error);
    res.status(500).json({ message: '添加用户失败' });
  }
});

app.put('/api/users/:email', (req, res) => {
  try {
    const { email } = req.params;
    const userData = req.body;
    console.log('Updating user:', email, userData); // 调试日志
    
    const data = readUsers();
    const updatedUsers = data.approvedUsers.map(user => {
      if (user.email === email) {
        return { ...user, ...userData };
      }
      return user;
    });
    
    const updatedData = { ...data, approvedUsers: updatedUsers };
    
    if (writeUsers(updatedData)) {
      const updatedUser = updatedUsers.find(u => u.email === email);
      console.log('Updated user:', updatedUser); // 调试日志
      res.json(updatedUser);
    } else {
      res.status(500).json({ message: '更新失败' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: '更新用户失败' });
  }
});

app.post('/api/users/approve/:email', (req, res) => {
  try {
    const { email } = req.params;
    const data = readUsers();
    const userToApprove = data.pendingUsers.find(u => u.email === email);
    
    if (!userToApprove) {
      return res.status(404).json({ message: '待审核用户不存在' });
    }
    
    data.approvedUsers.push({
      ...userToApprove,
      status: 'approved'
    });
    
    data.pendingUsers = data.pendingUsers.filter(u => u.email !== email);
    
    if (writeUsers(data)) {
      res.json({ message: '用户已批准' });
    } else {
      res.status(500).json({ message: '操作失败' });
    }
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: '批准用户失败' });
  }
});

// 拒绝用户注册
app.post('/api/users/reject', (req, res) => {
  try {
    const { email } = req.body;
    const data = readUsers();
    
    // 从待审核列表中移除用户
    data.pendingUsers = data.pendingUsers.filter(u => u.email !== email);
    
    if (writeUsers(data)) {
      res.json({ message: '已拒绝用户注册' });
    } else {
      res.status(500).json({ message: '操作失败' });
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: '拒绝用户失败' });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取用户角色的路由
app.get('/api/user/role', verifyToken, (req, res) => {
  try {
    const users = readUsers();
    const user = users[req.user.username];

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ role: user.role });
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({ message: '获取用户角色失败' });
  }
});

// 添加验证令牌的路由
app.get('/api/auth/verify', verifyToken, (req, res) => {
  try {
    const users = readUsers();
    const user = users[req.user.username];

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 如果是普通用户，检查是否已审核
    if (user.role !== 'SUPER_ADMIN' && !user.isApproved) {
      return res.status(401).json({ message: '账户待审核' });
    }

    res.json({ 
      isValid: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: '验证失败' });
  }
});

// 修改重排序路由
app.put('/api/todos/reorder', verifyToken, (req, res) => {
  try {
    const { todoId, sourceIndex, destinationIndex } = req.body;
    const username = req.user.username;
    const todosPath = path.join(__dirname, 'data', `${username}_todos.json`);
    
    // 如果文件不存在，创建一个空的待办事项列表
    if (!fs.existsSync(todosPath)) {
      fs.writeFileSync(todosPath, JSON.stringify([], null, 2));
    }

    // 读取待办事项
    let todos = [];
    try {
      const data = fs.readFileSync(todosPath, 'utf8');
      todos = JSON.parse(data);
    } catch (error) {
      console.error('Error reading todos:', error);
      return res.status(500).json({ message: '读取待办事项失败' });
    }

    // 执行重排序
    const [movedItem] = todos.splice(sourceIndex, 1);
    todos.splice(destinationIndex, 0, movedItem);

    // 保存更新后的顺序
    try {
      fs.writeFileSync(todosPath, JSON.stringify(todos, null, 2));
      res.json({ message: '排序更新成功', todos });
    } catch (error) {
      console.error('Error saving todos:', error);
      res.status(500).json({ message: '保存更新失败' });
    }
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ message: error.message || '更新排序失败' });
  }
});

// 修改密码路由
app.put('/api/user/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    // 验证请求数据
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '当前密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码至少需要6个字符' });
    }

    // 读取用户数据
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = data.users[username];

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '当前密码错误' });
    }

    // 更新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    data.users[username].password = hashedNewPassword;

    // 保存更新后的用户数据
    fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: '密码修改失败' });
  }
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 记录错误但不立即退出
  if (server.listening) {
    gracefulShutdown();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 优雅关闭服务器
function gracefulShutdown(signal) {
  console.log(`收到信号: ${signal || 'manual trigger'}`);
  
  // 设置超时强制关闭
  const forcedTimeout = setTimeout(() => {
    console.error('强制关闭服务器');
    process.exit(1);
  }, 30000); // 30秒后强制关闭

  server.close(() => {
    console.log('服务器已关闭');
    clearTimeout(forcedTimeout);
    process.exit(0);
  });
}

// 监听终止信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 启动服务器函数
const startServer = () => {
  try {
    if (server.listening) {
      console.log('服务器已在运行');
      return;
    }

    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });

    // 处理服务器错误
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用`);
        setTimeout(() => {
          server.close();
          console.log('尝试使用新端口...');
          server.listen(PORT + 1);
        }, 1000);
      } else {
        console.error('服务器错误:', error);
        gracefulShutdown();
      }
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 检查端口是否被占用
const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const tempServer = require('net').createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tempServer.close();
        resolve(true);
      })
      .listen(port);
  });
};

// 启动前检查端口
(async () => {
  try {
    const isPortAvailable = await checkPort(PORT);
    if (!isPortAvailable) {
      console.log(`端口 ${PORT} 已被占用，尝试使用端口 ${PORT + 1}`);
      process.env.PORT = PORT + 1;
    }
    startServer();
  } catch (error) {
    console.error('端口检查失败:', error);
    process.exit(1);
  }
})(); 