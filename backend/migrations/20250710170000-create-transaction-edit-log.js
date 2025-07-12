'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransactionEditLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      editor_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      editor_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      field: {
        type: Sequelize.STRING,
        allowNull: false
      },
      old_value: {
        type: Sequelize.STRING,
        allowNull: true
      },
      new_value: {
        type: Sequelize.STRING,
        allowNull: true
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TransactionEditLogs');
  }
}; 