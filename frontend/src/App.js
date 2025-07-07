import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AdvancePaymentPage from './pages/AdvancePaymentPage';

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
      </Routes>
    </Router>
  );
}

export default App;
