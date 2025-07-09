'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Machines', 'type', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Type of machine: point_in_out or prize_dispensing'
    });
    await queryInterface.addColumn('Machines', 'standard_quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Standard number of prizes for prize_dispensing machines'
    });
    await queryInterface.addColumn('Machines', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Associated product for prize_dispensing machines'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Machines', 'type');
    await queryInterface.removeColumn('Machines', 'standard_quantity');
    await queryInterface.removeColumn('Machines', 'product_id');
  }
};
