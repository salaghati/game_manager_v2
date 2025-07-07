'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PointTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PointTransaction.init({
    machine_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    branch_id: DataTypes.INTEGER,
    transaction_type: DataTypes.STRING,
    points_in: DataTypes.INTEGER,
    points_out: DataTypes.INTEGER,
    previous_balance: DataTypes.INTEGER,
    current_balance: DataTypes.INTEGER,
    transaction_date: DataTypes.DATE,
    created_at: DataTypes.DATE,
    daily_point: DataTypes.INTEGER,
    final_amount: DataTypes.INTEGER,
    rate: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'PointTransaction',
  });
  return PointTransaction;
};