'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Thêm cột is_deleted vào bảng Machines
    await queryInterface.addColumn('Machines', 'is_deleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Thêm cột is_deleted vào bảng Branches
    await queryInterface.addColumn('Branches', 'is_deleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Xóa cột is_deleted khỏi bảng Machines
    await queryInterface.removeColumn('Machines', 'is_deleted');
    
    // Xóa cột is_deleted khỏi bảng Branches
    await queryInterface.removeColumn('Branches', 'is_deleted');
  }
};
