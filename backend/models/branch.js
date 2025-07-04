'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Branch has many Machines
      Branch.hasMany(models.Machine, { foreignKey: 'branch_id', as: 'machines' });
      // Branch has many Users
      Branch.hasMany(models.User, { foreignKey: 'branch_id', as: 'users' });
    }
  }
  Branch.init({
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    manager_name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Branch',
  });
  return Branch;
};