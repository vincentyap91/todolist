const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限访问此页面' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    await user.update({ status });
    res.json({ message: '状态更新成功' });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ message: '更新状态失败' });
  }
});

module.exports = router; 