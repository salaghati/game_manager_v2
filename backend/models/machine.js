'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Machine extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Machine belongs to Branch
      Machine.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    }
  }
  Machine.init({
    machine_code: DataTypes.STRING,
    name: DataTypes.STRING,
    branch_id: DataTypes.INTEGER,
    current_points: DataTypes.INTEGER,
    rate: DataTypes.FLOAT,
    created_at: DataTypes.DATE,
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Machine',
  });
  return Machine;
};