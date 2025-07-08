#!/usr/bin/env node

console.log('🔍 Kiểm tra Environment Variables...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL có tồn tại:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

if (!process.env.DATABASE_URL) {
  console.error('❌ LỖI: DATABASE_URL không được set!');
  console.log('💡 Hướng dẫn sửa:');
  console.log('1. Vào Railway Dashboard');
  console.log('2. Service chính → Variables');
  console.log('3. Thêm DATABASE_URL từ PostgreSQL service');
  process.exit(1);
}

console.log('✅ DATABASE_URL đã được set!');
console.log('🚀 Tiếp tục migration...'); 