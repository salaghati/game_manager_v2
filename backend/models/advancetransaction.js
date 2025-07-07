'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdvanceTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // AdvanceTransaction belongs to User (nhân viên tạm ứng)
      AdvanceTransaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // AdvanceTransaction belongs to Branch
      AdvanceTransaction.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
      // AdvanceTransaction belongs to User (người tạo giao dịch)
      AdvanceTransaction.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
      // Self-reference cho thanh toán (trỏ tới lần tạm ứng)
      AdvanceTransaction.belongsTo(models.AdvanceTransaction, { foreignKey: 'advance_transaction_id', as: 'advance_transaction' });
      AdvanceTransaction.hasMany(models.AdvanceTransaction, { foreignKey: 'advance_transaction_id', as: 'payments' });
    }
  }
  AdvanceTransaction.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('ADVANCE', 'PAYMENT'),
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    advance_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    remaining_amount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'AdvanceTransaction',
  });
  return AdvanceTransaction;
}; 