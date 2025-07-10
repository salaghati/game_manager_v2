'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DailyMachineAudit extends Model {
    static associate(models) {
      DailyMachineAudit.belongsTo(models.Machine, { foreignKey: 'machine_id', as: 'machine' });
      DailyMachineAudit.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  DailyMachineAudit.init({
    machine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Machines', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    audit_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    start_of_day_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    end_of_day_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    gifts_won: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    end_of_day_coins: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    coin_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 1000
    },
    gift_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    revenue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    is_refilled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'DailyMachineAudit',
    tableName: 'DailyMachineAudits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return DailyMachineAudit;
}; 