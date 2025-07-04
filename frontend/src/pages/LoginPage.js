import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Xử lý submit form đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Gọi API backend để đăng nhập
      const res = await axios.post('http://localhost:3002/api/login', { username, password });
      // Lưu token vào localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      // Chuyển sang trang chính
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Đăng nhập hệ thống</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Tài khoản:</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{width: '100%', padding: 8}} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Mật khẩu:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{width: '100%', padding: 8}} />
        </div>
        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
        <button type="submit" style={{ marginTop: 16, width: '100%', padding: 10, cursor: 'pointer' }}>Đăng nhập</button>
      </form>
    </div>
  );
}

export default LoginPage; 