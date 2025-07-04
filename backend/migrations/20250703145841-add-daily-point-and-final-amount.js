'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PointTransactions', 'daily_point', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('PointTransactions', 'final_amount', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('PointTransactions', 'daily_point');
    await queryInterface.removeColumn('PointTransactions', 'final_amount');
  }
}; 