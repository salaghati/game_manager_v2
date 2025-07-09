'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('DailyMachineAudits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      machine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Machines', key: 'id' }
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
      },
      audit_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      start_of_day_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      end_of_day_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      gifts_won: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_refilled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DailyMachineAudits');
  }
};
