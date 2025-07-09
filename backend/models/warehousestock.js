'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WarehouseStock extends Model {
    static associate(models) {
      WarehouseStock.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    }
  }
  WarehouseStock.init({
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'WarehouseStock',
    tableName: 'WarehouseStocks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return WarehouseStock;
}; 