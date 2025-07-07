'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AdvanceTransactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Branches',
          key: 'id'
        }
      },
      transaction_type: {
        type: Sequelize.ENUM('ADVANCE', 'PAYMENT'),
        allowNull: false
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số tiền tạm ứng hoặc thanh toán (VND)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      advance_transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'AdvanceTransactions',
          key: 'id'
        },
        comment: 'ID của lần tạm ứng (chỉ áp dụng cho PAYMENT)'
      },
      remaining_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Số tiền còn lại của lần tạm ứng này (chỉ áp dụng cho ADVANCE)'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AdvanceTransactions');
  }
}; 