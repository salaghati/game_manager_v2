'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm một số dữ liệu mẫu cho AdvanceTransaction
    await queryInterface.bulkInsert('AdvanceTransactions', [
      {
        user_id: 1, // Giả sử user có id = 1
        branch_id: 1, // Giả sử branch có id = 1
        transaction_type: 'ADVANCE',
        amount: 5000000, // 5 triệu
        description: 'Tạm ứng tháng 7/2025',
        transaction_date: new Date('2025-07-01'),
        remaining_amount: 3000000, // Còn lại 3 triệu
        created_by: 1, // Admin tạo
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 1,
        branch_id: 1,
        transaction_type: 'PAYMENT',
        amount: 2000000, // Thanh toán 2 triệu
        description: 'Thanh toán một phần tạm ứng tháng 7',
        transaction_date: new Date('2025-07-03'),
        advance_transaction_id: 1, // Trỏ tới tạm ứng đầu tiên
        created_by: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 1,
        branch_id: 1,
        transaction_type: 'ADVANCE',
        amount: 2000000, // 2 triệu
        description: 'Tạm ứng bổ sung ngày 2/7',
        transaction_date: new Date('2025-07-02'),
        remaining_amount: 2000000, // Còn nguyên 2 triệu
        created_by: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AdvanceTransactions', null, {});
  }
}; 