const fs = require('fs');

// Đọc file
let content = fs.readFileSync('./frontend/src/pages/MainPage.js', 'utf8');

// Thay thế từng cái một
content = content.replace(/'\${API_CONFIG\.BASE_URL}'/g, '`${API_CONFIG.BASE_URL}`');

// Ghi lại
fs.writeFileSync('./frontend/src/pages/MainPage.js', content, 'utf8');

console.log('✅ Fixed all template strings');

// Kiểm tra
const check = fs.readFileSync('./frontend/src/pages/MainPage.js', 'utf8');
const count = (check.match(/'\${API_CONFIG\.BASE_URL}'/g) || []).length;
console.log('Remaining single quotes:', count); 