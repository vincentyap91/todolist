'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.describeTable('Todos').then(async (tableDefinition) => {
      if (!tableDefinition.order) {
        await queryInterface.addColumn('Todos', 'order', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        });
        
        // 初始化现有任务的顺序
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
        
        // 更新每个用户的任务顺序
        for (const userId in todosByUser) {
          const userTodos = todosByUser[userId];
          for (let i = 0; i < userTodos.length; i++) {
            await queryInterface.sequelize.query(
              `UPDATE "Todos" SET order = ${i} WHERE id = ${userTodos[i]}`
            );
          }
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Todos', 'order');
  }
}; 