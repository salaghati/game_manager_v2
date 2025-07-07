'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User has many AdvanceTransactions (as employee)
      User.hasMany(models.AdvanceTransaction, { foreignKey: 'user_id', as: 'advance_transactions' });
      // User has many AdvanceTransactions (as creator)
      User.hasMany(models.AdvanceTransaction, { foreignKey: 'created_by', as: 'created_advance_transactions' });
      // User belongs to Branch
      User.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    }
  }
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    full_name: DataTypes.STRING,
    branch_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};