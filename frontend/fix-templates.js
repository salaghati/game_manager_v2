const fs = require('fs');
const path = require('path');

// Đọc file MainPage.js
const filePath = path.join(__dirname, 'src/pages/MainPage.js');
let content = fs.readFileSync(filePath, 'utf8');

// Thay thế tất cả single quotes template strings thành backticks
content = content.replace(/'(\$\{API_CONFIG\.BASE_URL\})'/g, '`$1`');

// Ghi lại file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed template strings in MainPage.js');

// Kiểm tra AdvancePaymentPage.js
const advancePagePath = path.join(__dirname, 'src/pages/AdvancePaymentPage.js');
let advanceContent = fs.readFileSync(advancePagePath, 'utf8');

// Thay thế nếu có
advanceContent = advanceContent.replace(/'(\$\{API_CONFIG\.BASE_URL\})'/g, '`$1`');

fs.writeFileSync(advancePagePath, advanceContent, 'utf8');

console.log('✅ Fixed template strings in AdvancePaymentPage.js');
console.log('🎉 All template strings fixed!'); 