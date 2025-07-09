import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AdvancePaymentPage from './pages/AdvancePaymentPage';
import ProductManagementPage from './pages/ProductManagementPage';
import WarehouseManagementPage from './pages/WarehouseManagementPage';
import DailyAuditPage from './pages/DailyAuditPage';
import ReportsPage from './pages/ReportsPage';


// Hàm kiểm tra đã đăng nhập hay chưa (dựa vào localStorage)
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        {/* Trang chính: nhập liệu, lịch sử, ... */}
        <Route path="/" element={
          <RequireAuth>
            <MainPage />
          </RequireAuth>
        } />
        {/* Trang quản lý tạm ứng/thanh toán */}
        <Route path="/advance-payment" element={
          <RequireAuth>
            <AdvancePaymentPage />
          </RequireAuth>
        } />
        {/* --- Các trang mới --- */}
        <Route path="/products" element={<RequireAuth><ProductManagementPage /></RequireAuth>} />
        <Route path="/warehouse" element={<RequireAuth><WarehouseManagementPage /></RequireAuth>} />
        <Route path="/audit/:machineId" element={<RequireAuth><DailyAuditPage /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
      </Routes>
    </Router>
  );
}

export default App;
