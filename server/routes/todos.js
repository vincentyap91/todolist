const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const verifyToken = require('../middleware/auth');
const { sequelize } = require('../models/Todo');

// 重排序待办事项
router.put('/reorder', verifyToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { sourceIndex, destinationIndex } = req.body;
    
    // 获取用户的所有待办事项
    const todos = await Todo.findAll({
      where: { userId: req.user.id },
      order: [['order', 'ASC']],
      transaction
    });

    // 执行重排序
    const [movedTodo] = todos.splice(sourceIndex, 1);
    todos.splice(destinationIndex, 0, movedTodo);

    // 批量更新顺序
    await Promise.all(
      todos.map((todo, index) => 
        Todo.update(
          { order: index },
          { where: { id: todo.id }, transaction }
        )
      )
    );

    // 提交事务
    await transaction.commit();

    // 返回更新后的列表
    const updatedTodos = await Todo.findAll({
      where: { userId: req.user.id },
      order: [['order', 'ASC']]
    });

    res.json(updatedTodos);
  } catch (error) {
    // 发生错误时回滚事务
    if (transaction) await transaction.rollback();
    console.error('重排序失败:', error);
    res.status(500).json({ message: '重排序失败', error: error.message });
  }
});

// 重新排序任务路由
router.post('/reorder', verifyToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { todoIds } = req.body;
    console.log('重新排序任务请求:', todoIds);
    
    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: '无效的任务ID列表' });
    }
    
    // 验证所有任务都属于当前用户
    const todos = await Todo.findAll({
      where: { 
        id: todoIds,
        UserId: req.user.id
      },
      transaction
    });
    
    if (todos.length !== todoIds.length) {
      console.error(`任务验证失败: 找到 ${todos.length}个, 请求了 ${todoIds.length}个`);
      await transaction.rollback();
      return res.status(403).json({ message: '无权重新排序某些任务' });
    }
    
    // 记录排序前状态
    console.log('排序前状态:', todos.map(t => ({ id: t.id, order: t.order })));
    
    // 逐个更新任务顺序
    for (let i = 0; i < todoIds.length; i++) {
      await Todo.update(
        { order: i },
        { 
          where: { 
            id: todoIds[i],
            UserId: req.user.id
          },
          transaction
        }
      );
      console.log(`更新任务 ID:${todoIds[i]} 顺序为 ${i}`);
    }
    
    // 提交事务
    await transaction.commit();
    
    // 获取更新后的任务列表，验证顺序是否已保存
    const updatedTodos = await Todo.findAll({
      where: { UserId: req.user.id },
      order: [['order', 'ASC']]
    });
    
    console.log('排序后状态:', updatedTodos.map(t => ({ id: t.id, order: t.order })));
    
    // 返回已排序的任务列表
    res.json(updatedTodos);
  } catch (error) {
    // 发生错误时回滚事务
    if (transaction) await transaction.rollback();
    console.error('重新排序任务失败:', error);
    res.status(500).json({ message: '重新排序任务失败', error: error.message });
  }
});

// 获取任务列表
router.get('/todos', verifyToken, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { UserId: req.user.id },
      order: [['order', 'ASC']] // 确保按 order 字段升序排序
    });
    
    console.log(`获取用户 ${req.user.id} 的任务:`, todos.map(t => ({ id: t.id, text: t.text.substring(0, 10), order: t.order })));
    
    res.json(todos);
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ message: '获取任务失败', error: error.message });
  }
});

module.exports = router; 