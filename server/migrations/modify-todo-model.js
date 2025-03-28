'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 删除 order 字段（如果存在）
    await queryInterface.describeTable('Todos').then(async (tableDefinition) => {
      if (tableDefinition.order) {
        await queryInterface.removeColumn('Todos', 'order');
      }
    });
    
    // 添加新的 position 字段
    await queryInterface.addColumn('Todos', 'position', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
    
    // 初始化现有任务的位置
    const todos = await queryInterface.sequelize.query(
      'SELECT id, "UserId" FROM "Todos" ORDER BY id ASC',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // 按用户分组
    const todosByUser = {};
    todos.forEach(todo => {
      if (!todosByUser[todo.UserId]) {
        todosByUser[todo.UserId] = [];
      }
      todosByUser[todo.UserId].push(todo.id);
    });
    
    // 更新每个用户的任务位置
    for (const userId in todosByUser) {
      const userTodos = todosByUser[userId];
      for (let i = 0; i < userTodos.length; i++) {
        await queryInterface.sequelize.query(
          `UPDATE "Todos" SET position = ${(i + 1) * 1000} WHERE id = ${userTodos[i]}`
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Todos', 'position');
    await queryInterface.addColumn('Todos', 'order', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  }
}; 