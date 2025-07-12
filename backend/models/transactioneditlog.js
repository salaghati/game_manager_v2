'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransactionEditLog extends Model {
    static associate(models) {
      // define association here nếu cần
    }
  }
  TransactionEditLog.init({
    transaction_id: DataTypes.INTEGER,
    editor_id: DataTypes.INTEGER, // user id của người sửa
    editor_name: DataTypes.STRING, // tên người sửa
    field: DataTypes.STRING, // trường bị sửa
    old_value: DataTypes.STRING, // giá trị cũ
    new_value: DataTypes.STRING, // giá trị mới
    edited_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'TransactionEditLog',
    tableName: 'TransactionEditLogs',
    timestamps: false
  });
  return TransactionEditLog;
}; 