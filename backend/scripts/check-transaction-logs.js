#!/usr/bin/env node

const { Sequelize, DataTypes } = require('sequelize');

console.log('🔍 Kiểm tra bảng TransactionEditLogs');
console.log('=====================================');

async function checkTransactionLogs() {
  try {
    console.log('📋 Environment:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    // Tạo connection
    const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite', {
      dialect: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
      dialectOptions: process.env.DATABASE_URL ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {},
      logging: false
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection OK');

    // Kiểm tra bảng TransactionEditLogs
    console.log('\n🔍 Checking TransactionEditLogs table...');
    
    try {
      const tableExists = await sequelize.getQueryInterface().showAllTables();
      console.log('📊 All tables:', tableExists);
      
      const hasTransactionLogs = tableExists.includes('TransactionEditLogs');
      console.log('TransactionEditLogs exists:', hasTransactionLogs);
      
      if (!hasTransactionLogs) {
        console.log('\n❌ TransactionEditLogs table không tồn tại!');
        console.log('🔄 Creating table...');
        
        // Tạo bảng TransactionEditLogs
        await sequelize.getQueryInterface().createTable('TransactionEditLogs', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
          },
          transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
          },
          editor_id: {
            type: DataTypes.INTEGER,
            allowNull: false
          },
          editor_name: {
            type: DataTypes.STRING,
            allowNull: false
          },
          field: {
            type: DataTypes.STRING,
            allowNull: false
          },
          old_value: {
            type: DataTypes.STRING,
            allowNull: true
          },
          new_value: {
            type: DataTypes.STRING,
            allowNull: true
          },
          edited_at: {
            type: DataTypes.DATE,
            allowNull: false
          }
        });
        
        console.log('✅ TransactionEditLogs table created successfully!');
      } else {
        console.log('✅ TransactionEditLogs table đã tồn tại');
        
        // Kiểm tra cấu trúc bảng
        const tableDescription = await sequelize.getQueryInterface().describeTable('TransactionEditLogs');
        console.log('📋 Table structure:', Object.keys(tableDescription));
      }
      
    } catch (error) {
      console.log('❌ Error checking/creating table:', error.message);
    }

    await sequelize.close();
    console.log('\n✅ Check completed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

checkTransactionLogs(); 