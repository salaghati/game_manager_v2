# Game Manager System v2

Hệ thống quản lý máy game với các tính năng đầy đủ cho việc theo dõi điểm số, quản lý máy và chi nhánh.

## 🚀 Tính năng chính

### 🎮 Quản lý máy game
- **Soft Delete**: Xóa mềm máy và chi nhánh (đánh dấu `is_deleted` thay vì xóa vĩnh viễn)
- **Current Balance**: Hiển thị điểm balance thực tế từ transaction mới nhất
- **Rate Management**: Quản lý tỷ lệ quy đổi (hỗ trợ số thập phân), không ảnh hưởng dữ liệu cũ
- **Demo Mode**: Toggle để cho phép/chặn ghi đè dữ liệu ngày đã nhập

### 📊 Nhập liệu và lịch sử
- **Validation**: Kiểm tra ngày đã nhập, cảnh báo ghi đè
- **Edit Transaction**: Chỉnh sửa transaction mới nhất (Point In/Out, Balance, Final Amount)
- **Auto Calculate**: Tự động tính Daily Point từ Balance
- **History Tracking**: Lưu lịch sử đầy đủ với branch info

### 🏢 Quản lý chi nhánh
- **Branch Info**: Hiển thị thông tin chi nhánh trong dropdown và bảng
- **Role-based Access**: Admin xem tất cả, user chỉ xem chi nhánh của mình
- **Soft Delete**: Xóa mềm chi nhánh

### 🔐 Bảo mật
- **JWT Authentication**: Xác thực token
- **Role-based Authorization**: Phân quyền admin/user
- **Branch-level Security**: Giới hạn truy cập theo chi nhánh

## 🛠 Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js**
- **SQLite** + **Sequelize ORM**
- **JWT** cho authentication
- **bcrypt** cho mã hóa password

### Frontend
- **React.js** với **Hooks**
- **Axios** cho API calls
- **Bootstrap** cho styling
- **LocalStorage** cho token management

### Database Schema
- **Branches**: Quản lý chi nhánh
- **Machines**: Thông tin máy game
- **Users**: Tài khoản người dùng
- **PointTransactions**: Giao dịch điểm số

## 📁 Cấu trúc project

```
Game Manager/
├── backend/                 # Node.js API server
│   ├── models/             # Sequelize models
│   ├── migrations/         # Database migrations
│   ├── seeders/           # Sample data
│   ├── config/            # Database config
│   ├── app.js             # Main API routes
│   └── server.js          # Server entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # Main pages
│   │   ├── App.js         # Main component
│   │   └── index.js       # Entry point
│   └── public/            # Static files
├── package.json           # Root dependencies
└── README.md             # This file
```

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone https://github.com/salaghati/game_manager_v2.git
cd game_manager_v2
```

### 2. Cài đặt dependencies
```bash
# Root level
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Chạy migration và seed data
```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 4. Khởi động ứng dụng
```bash
# Terminal 1: Backend (port 3002)
cd backend
node server.js

# Terminal 2: Frontend (port 3000)
cd frontend
npm start
```

### 5. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002

## 👤 Tài khoản mặc định

- **Username**: admin
- **Password**: admin123
- **Role**: Admin (full access)

## 📝 API Endpoints

### Authentication
- `POST /api/login` - Đăng nhập

### Machines
- `GET /api/machines` - Lấy danh sách máy
- `POST /api/machines` - Tạo máy mới
- `PUT /api/machines/:id` - Cập nhật máy
- `DELETE /api/machines/:id` - Xóa mềm máy

### Branches  
- `GET /api/branches` - Lấy danh sách chi nhánh
- `POST /api/branches` - Tạo chi nhánh mới
- `PUT /api/branches/:id` - Cập nhật chi nhánh
- `DELETE /api/branches/:id` - Xóa mềm chi nhánh

### Point Transactions
- `GET /api/point` - Lấy dữ liệu theo ngày
- `POST /api/point` - Nhập dữ liệu mới
- `PUT /api/transactions/:id` - Chỉnh sửa transaction
- `GET /api/history` - Lấy lịch sử nhập liệu
- `DELETE /api/history` - Reset lịch sử

## 🎯 Tính năng nổi bật

### Demo Mode Toggle
- **DEMO**: Cho phép ghi đè dữ liệu ngày đã nhập
- **SẢN XUẤT**: Chặn ghi đè, hiển thị cảnh báo

### Soft Delete System
- Máy và chi nhánh được đánh dấu `is_deleted = true` thay vì xóa vĩnh viễn
- Dữ liệu được bảo toàn, có thể khôi phục

### Current Balance Tracking
- Hiển thị điểm balance thực tế từ transaction mới nhất
- Không dựa vào field `current_points` cũ trong bảng Machines

### Edit Latest Transaction
- Chỉ cho phép edit transaction mới nhất
- Auto-calculate Daily Point khi thay đổi Balance
- Validation đầy đủ

## 🔧 Development

### Database Migration
```bash
# Tạo migration mới
npx sequelize-cli migration:generate --name migration-name

# Chạy migration
npx sequelize-cli db:migrate

# Rollback migration
npx sequelize-cli db:migrate:undo
```

### Seed Data
```bash
# Chạy seed
npx sequelize-cli db:seed:all

# Rollback seed
npx sequelize-cli db:seed:undo:all
```

## 📞 Hỗ trợ

Nếu có vấn đề gì, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết. 