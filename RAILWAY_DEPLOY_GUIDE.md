# 🚀 Hướng dẫn sửa lỗi Railway Deploy

## ❌ Vấn đề hiện tại
- Không thấy log lịch sử chỉnh sửa
- Không thấy những thay đổi mới
- DATABASE_URL chưa được cấu hình

## 🔧 Cách sửa lỗi

### 1. Cấu hình DATABASE_URL trên Railway

1. **Vào Railway Dashboard**
   - Truy cập https://railway.app/dashboard
   - Chọn project của bạn

2. **Tạo PostgreSQL Database**
   - Nếu chưa có: Click "New Service" → "Database" → "PostgreSQL"
   - Đặt tên: `game-manager-db`

3. **Lấy DATABASE_URL**
   - Click vào PostgreSQL service
   - Vào tab "Connect"
   - Copy "Postgres Connection URL"

4. **Cấu hình cho Backend Service**
   - Click vào backend service
   - Vào tab "Variables"
   - Thêm biến mới:
     - **Name**: `DATABASE_URL`
     - **Value**: Paste connection URL từ bước 3

### 2. Cấu hình Environment Variables

Thêm các biến sau vào backend service:

```
NODE_ENV=production
JWT_SECRET=your-secret-key-here
```

### 3. Kiểm tra và chạy Migration

1. **Kiểm tra deploy status**:
   ```bash
   npm run deploy-check
   ```

2. **Nếu migration chưa chạy**:
   - Railway sẽ tự động chạy migration khi deploy
   - Hoặc manual: `npm run db:migrate:prod`

### 4. Restart Service

- Vào Railway Dashboard
- Click "Deploy" để restart service

## 📋 Checklist

- [ ] DATABASE_URL đã được cấu hình
- [ ] NODE_ENV=production
- [ ] JWT_SECRET đã set
- [ ] Migration đã chạy thành công
- [ ] Service đã restart

## 🔍 Kiểm tra sau khi sửa

1. **Kiểm tra logs**:
   - Vào Railway Dashboard → Service → Logs
   - Tìm dòng "✅ Database connection successful!"

2. **Test API**:
   - Gọi API: `GET /api/point?machine_id=1&date=2024-01-01`
   - Nếu trả về data → Database OK

3. **Test Edit Transaction**:
   - Edit một transaction
   - Kiểm tra có log lịch sử không

## 🆘 Nếu vẫn lỗi

1. **Kiểm tra logs chi tiết**:
   ```bash
   npm run deploy-check
   ```

2. **Kiểm tra database connection**:
   - Vào PostgreSQL service → Connect
   - Test connection

3. **Reset và deploy lại**:
   - Xóa service cũ
   - Tạo service mới
   - Deploy lại

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề, hãy:
1. Chạy `npm run deploy-check` và gửi output
2. Chụp màn hình Railway Dashboard
3. Gửi logs từ Railway 