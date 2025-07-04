const app = require('./app');
const PORT = process.env.PORT || 3002;

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy ở http://localhost:${PORT}`);
}); 