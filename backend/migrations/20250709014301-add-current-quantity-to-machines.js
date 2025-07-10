'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Machines', 'current_quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Số lượng quà hiện tại trong máy (dành cho máy gắp gấu)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Machines', 'current_quantity');
  }
}; 