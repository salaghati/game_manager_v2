#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Force Migration for TransactionEditLogs');
console.log('==========================================');

async function forceMigrate() {
  try {
    console.log('📋 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL không có, sử dụng SQLite local');
    }

    console.log('\n🔄 Running migrations...');
    
    // Chạy migration
    const migrateResult = execSync('npx sequelize-cli db:migrate', {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });
    
    console.log('✅ Migration result:');
    console.log(migrateResult);
    
    console.log('\n📊 Checking migration status...');
    const statusResult = execSync('npx sequelize-cli db:migrate:status', {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });
    
    console.log('📋 Migration status:');
    console.log(statusResult);
    
    console.log('\n✅ Force migration completed!');
    console.log('💡 Nếu vẫn không thấy TransactionEditLogs, hãy:');
    console.log('1. Kiểm tra logs trên Railway');
    console.log('2. Restart service');
    console.log('3. Kiểm tra database trực tiếp');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Debug steps:');
    console.log('1. Kiểm tra DATABASE_URL có đúng không');
    console.log('2. Kiểm tra database connection');
    console.log('3. Kiểm tra logs chi tiết');
  }
}

forceMigrate(); 