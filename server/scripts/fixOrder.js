const Todo = require('../models/Todo');
const sequelize = require('../config/database');

async function fixTodoOrder() {
  const t = await sequelize.transaction();
  
  try {
    // 获取所有用户的待办事项
    const users = await sequelize.query(
      'SELECT DISTINCT userId FROM Todos',
      { type: sequelize.QueryTypes.SELECT }
    );

    // 为每个用户修复顺序
    for (const user of users) {
      const todos = await Todo.findAll({
        where: { userId: user.userId },
        order: [['createdAt', 'ASC']],
        transaction: t
      });

      // 更新顺序
      await Promise.all(
        todos.map((todo, index) => 
          todo.update({ order: index }, { transaction: t })
        )
      );
    }

    await t.commit();
    console.log('所有待办事项顺序已修复');
  } catch (error) {
    await t.rollback();
    console.error('修复顺序失败:', error);
  }
}

// 如果直接运行此脚本，执行修复
if (require.main === module) {
  fixTodoOrder()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} 