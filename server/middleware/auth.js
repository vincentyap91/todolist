const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    const user = await User.findOne({ 
      where: { id: decoded.id },
      attributes: ['id', 'username', 'role', 'status']
    });

    if (!user) {
      return res.status(403).json({ message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(403).json({ message: '无效的认证令牌' });
  }
};

module.exports = verifyToken; 