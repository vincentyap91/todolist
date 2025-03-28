const { sequelize, Todo } = require('./models');

async function fixTodoOrder() {
  try {
    console.log('开始修复任务顺序...');
    
    // 检查 order 字段是否存在
    try {
      await sequelize.query('SELECT "order" FROM "Todos" LIMIT 1');
      console.log('order 字段存在');
    } catch (error) {
      console.log('order 字段不存在，正在添加...');
      await sequelize.query('ALTER TABLE "Todos" ADD COLUMN "order" INTEGER DEFAULT 0 NOT NULL');
    }
    
    // 获取所有用户 ID
    const [userIds] = await sequelize.query('SELECT DISTINCT "UserId" FROM "Todos"');
    console.log(`找到 ${userIds.length} 个用户`);
    
    // 为每个用户的任务初始化 order 字段
    for (const userIdObj of userIds) {
      const userId = userIdObj.UserId;
      console.log(`处理用户 ID: ${userId} 的任务...`);
      
      const [todos] = await sequelize.query(`
        SELECT id FROM "Todos" 
        WHERE "UserId" = ${userId} 
        ORDER BY id ASC
      `);
      
      console.log(`用户 ${userId} 有 ${todos.length} 个任务`);
      
      for (let i = 0; i < todos.length; i++) {
        await sequelize.query(`
          UPDATE "Todos" 
          SET "order" = ${i} 
          WHERE id = ${todos[i].id}
        `);
        console.log(`更新任务 ID:${todos[i].id} 的顺序为 ${i}`);
      }
    }
    
    console.log('任务顺序修复完成');
  } catch (error) {
    console.error('修复任务顺序失败:', error);
  } finally {
    await sequelize.close();
  }
}

fixTodoOrder()
  .then(() => console.log('脚本执行完成'))
  .catch(err => console.error('脚本执行失败:', err)); 