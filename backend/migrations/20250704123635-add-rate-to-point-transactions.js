'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('PointTransactions', 'rate', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 2.0,
      comment: 'Tỉ lệ rate tại thời điểm tạo transaction (lưu giữ để không thay đổi khi rate máy thay đổi)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('PointTransactions', 'rate');
  }
};
