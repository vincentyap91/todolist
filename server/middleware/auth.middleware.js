const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key'; // 确保与登录时使用的密钥相同

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: '无效的认证令牌' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: '需要超级管理员权限' });
  }
};

module.exports = {
  verifyToken,
  isSuperAdmin
}; 