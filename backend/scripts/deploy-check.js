#!/usr/bin/env node

console.log('🚀 Game Manager - Railway Deploy Check');
console.log('=====================================');

// Kiểm tra environment
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('PORT:', process.env.PORT || 'undefined');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Kiểm tra database connection
const { Sequelize } = require('sequelize');

async function checkDatabase() {
  console.log('\n🗄️  Database Connection Test:');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL không được set!');
    console.log('\n💡 Cách sửa trên Railway:');
    console.log('1. Vào Railway Dashboard');
    console.log('2. Chọn service của bạn');
    console.log('3. Vào tab "Variables"');
    console.log('4. Thêm DATABASE_URL từ PostgreSQL service');
    console.log('5. Format: postgresql://username:password@host:port/database');
    return false;
  }

  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Kiểm tra các bảng
    const tables = await sequelize.showAllSchemas();
    console.log('📊 Available tables:', tables.map(t => t.name));
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// Kiểm tra migrations
async function checkMigrations() {
  console.log('\n🔄 Migration Status:');
  
  try {
    const { execSync } = require('child_process');
    const result = execSync('npx sequelize-cli db:migrate:status', { 
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log(result);
  } catch (error) {
    console.log('❌ Không thể kiểm tra migration status:', error.message);
  }
}

// Main function
async function main() {
  const dbOk = await checkDatabase();
  
  if (dbOk) {
    await checkMigrations();
    
    console.log('\n🎯 Recommendations:');
    console.log('1. Nếu DATABASE_URL chưa set: Cấu hình trên Railway Dashboard');
    console.log('2. Nếu migration chưa chạy: Chạy "npm run db:migrate:prod"');
    console.log('3. Nếu seed data chưa có: Chạy "npm run db:seed:prod"');
    console.log('4. Restart service sau khi cấu hình');
  }
  
  console.log('\n✅ Deploy check completed!');
}

main().catch(console.error); 