import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdvancePaymentPage.css';
import API_CONFIG from '../config/api';

const AdvancePaymentPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [advanceForm, setAdvanceForm] = useState({
    user_id: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [paymentForm, setPaymentForm] = useState({
    user_id: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Lấy token từ localStorage và memoize headers
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users`, { headers });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(data.message || 'Lỗi khi tải danh sách nhân viên');
        }
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải danh sách nhân viên');
    }
  }, [headers, navigate]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_CONFIG.BASE_URL}/api/advance-transactions?limit=100`;
      if (selectedUser) url += `&user_id=${selectedUser}`;
      if (selectedType) url += `&type=${selectedType}`;

      const response = await fetch(url, { headers });
      const data = await response.json();
      if (response.ok) {
        setTransactions(data);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(data.message || 'Lỗi khi tải danh sách giao dịch');
        }
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  }, [headers, navigate, selectedUser, selectedType]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_CONFIG.BASE_URL}/api/advance-transactions/summary`;
      if (selectedUser) url += `?user_id=${selectedUser}`;

      const response = await fetch(url, { headers });
      const data = await response.json();
      if (response.ok) {
        setSummary(data);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(data.message || 'Lỗi khi tải tổng hợp công nợ');
        }
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải tổng hợp công nợ');
    } finally {
      setLoading(false);
    }
  }, [headers, navigate, selectedUser]);

  // Create advance
  const createAdvance = async () => {
    try {
      if (!advanceForm.user_id || !advanceForm.amount || !advanceForm.transaction_date) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/advance-transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: parseInt(advanceForm.user_id),
          amount: parseInt(advanceForm.amount),
          description: advanceForm.description,
          transaction_date: advanceForm.transaction_date
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAdvanceForm({
          user_id: '',
          amount: '',
          description: '',
          transaction_date: new Date().toISOString().split('T')[0]
        });
        fetchTransactions();
        fetchSummary();
        setError('');
        alert('Tạo tạm ứng thành công!');
      } else {
        setError(data.message || 'Lỗi khi tạo tạm ứng');
      }
    } catch (err) {
      setError('Lỗi kết nối khi tạo tạm ứng');
    }
  };

  // Create payment (thanh toán trực tiếp vào nợ tổng)
  const createPayment = async () => {
    try {
      if (!paymentForm.user_id || !paymentForm.amount || !paymentForm.transaction_date) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/advance-transactions/direct-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: parseInt(paymentForm.user_id),
          amount: parseInt(paymentForm.amount),
          description: paymentForm.description,
          transaction_date: paymentForm.transaction_date
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentForm({
          user_id: '',
          amount: '',
          description: '',
          transaction_date: new Date().toISOString().split('T')[0]
        });
        fetchTransactions();
        fetchSummary();
        setError('');
        alert('Thanh toán thành công! Số nợ đã được cập nhật.');
      } else {
        setError(data.message || 'Lỗi khi tạo thanh toán');
      }
    } catch (err) {
      setError('Lỗi kết nối khi tạo thanh toán');
    }
  };

  // Reset all advance transaction data
  const handleResetData = async () => {
    if (!window.confirm('⚠️ BẠN CÓ CHẮC MUỐN XÓA TOÀN BỘ DỮ LIỆU TẠM ỨNG/THANH TOÁN?\n\nHành động này KHÔNG THỂ HOÀN TÁC!')) {
      return;
    }

    if (!window.confirm('🔴 XÁC NHẬN LẦN CUỐI: Tất cả dữ liệu tạm ứng và thanh toán sẽ bị xóa vĩnh viễn!')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/advance-transactions/reset`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();
      if (response.ok) {
        // Refresh all data
        fetchTransactions();
        fetchSummary();
        setError('');
        alert('✅ Reset dữ liệu thành công! Đã xóa toàn bộ dữ liệu tạm ứng/thanh toán.');
      } else {
        if (response.status === 403) {
          setError('❌ Chỉ admin mới có quyền reset dữ liệu');
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(data.message || 'Lỗi khi reset dữ liệu');
        }
      }
    } catch (err) {
      setError('Lỗi kết nối khi reset dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchUsers();
    fetchTransactions();
    fetchSummary();
  }, [fetchUsers, fetchTransactions, fetchSummary]);

  // Update data when filters change
  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'summary') {
      fetchSummary();
    }
  }, [selectedUser, selectedType, activeTab, fetchTransactions, fetchSummary]);

  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get users with debt for quick selection
  const getUsersWithDebt = () => {
    return users.filter(user => 
      !selectedUser || user.id === parseInt(selectedUser)
    );
  };

  return (
    <div className="advance-payment-page">
      <div className="page-header">
        <div className="header-with-back">
          <button onClick={() => navigate('/')} className="back-button">
            ← Quay lại
          </button>
          <div className="header-content">
            <h1>Quản lý tạm ứng/thanh toán</h1>
            <p>Quản lý việc tạm ứng và thanh toán tiền cho nhân viên</p>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button 
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          Tổng hợp công nợ
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          Danh sách giao dịch
        </button>
        <button 
          className={activeTab === 'advance' ? 'active' : ''}
          onClick={() => setActiveTab('advance')}
        >
          Tạo tạm ứng
        </button>
        <button 
          className={activeTab === 'payment' ? 'active' : ''}
          onClick={() => setActiveTab('payment')}
        >
          Thanh toán nợ
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <div className="filters">
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Tất cả nhân viên</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.username})
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="summary-list">
                {summary.length === 0 ? (
                  <div className="no-data">Không có công nợ nào</div>
                ) : (
                  summary.map((item, index) => (
                    <div key={index} className="summary-item">
                      <div className="summary-header">
                        <h3>{item.user.full_name}</h3>
                        <div className={`debt-amount ${item.total_balance < 0 ? 'owner-owes' : ''}`}>
                          {item.total_balance >= 0 
                            ? `Số nợ hiện tại: ${formatCurrency(item.total_balance)}`
                            : `Số dư thừa: ${formatCurrency(Math.abs(item.total_balance))}`
                          }
                        </div>
                      </div>
                      <div className="summary-details">
                        <p>Tài khoản: {item.user.username}</p>
                        <p>Chi nhánh: {item.branch.name}</p>
                        <div className="debt-explanation">
                          <p><small>
                            • Số dương = Nhân viên đang nợ<br/>
                            • Số âm = Nhân viên đã trả thừa tiền
                          </small></p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <div className="filters">
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Tất cả nhân viên</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.username})
                  </option>
                ))}
              </select>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Tất cả loại giao dịch</option>
                <option value="ADVANCE">Tạm ứng</option>
                <option value="PAYMENT">Thanh toán</option>
              </select>
              <button 
                onClick={handleResetData}
                className="btn-danger reset-button"
                disabled={loading}
                title="Xóa toàn bộ dữ liệu tạm ứng/thanh toán (chỉ admin)"
                style={{
                  marginLeft: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '🔄 Đang xử lý...' : '🗑️ Reset dữ liệu'}
              </button>
            </div>

            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Nhân viên</th>
                      <th>Loại</th>
                      <th>Số tiền</th>
                      <th>Mô tả</th>
                      <th>Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{formatDate(transaction.transaction_date)}</td>
                        <td>{transaction.user.full_name}</td>
                        <td>
                          <span className={`transaction-type ${transaction.transaction_type.toLowerCase()}`}>
                            {transaction.transaction_type === 'ADVANCE' ? 'Tạm ứng' : 'Thanh toán'}
                          </span>
                        </td>
                        <td className={transaction.transaction_type === 'ADVANCE' ? 'advance-amount' : 'payment-amount'}>
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td>{transaction.description}</td>
                        <td>
                          {transaction.transaction_type === 'ADVANCE' ? 
                            formatCurrency(transaction.remaining_amount) : 
                            '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advance' && (
          <div className="advance-tab">
            <div className="form-container">
              <h3>Tạo tạm ứng mới</h3>
              <div className="form-group">
                <label>Nhân viên:</label>
                <select 
                  value={advanceForm.user_id} 
                  onChange={(e) => setAdvanceForm({...advanceForm, user_id: e.target.value})}
                >
                  <option value="">Chọn nhân viên</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.username}) - {user.branch?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Số tiền:</label>
                <input 
                  type="number" 
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({...advanceForm, amount: e.target.value})}
                  placeholder="Nhập số tiền (VND)"
                />
              </div>
              <div className="form-group">
                <label>Mô tả:</label>
                <input 
                  type="text" 
                  value={advanceForm.description}
                  onChange={(e) => setAdvanceForm({...advanceForm, description: e.target.value})}
                  placeholder="Mô tả lý do tạm ứng"
                />
              </div>
              <div className="form-group">
                <label>Ngày tạm ứng:</label>
                <input 
                  type="date" 
                  value={advanceForm.transaction_date}
                  onChange={(e) => setAdvanceForm({...advanceForm, transaction_date: e.target.value})}
                />
              </div>
              <button onClick={createAdvance} className="btn-primary">
                Tạo tạm ứng
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="payment-tab">
            <div className="form-container">
              <h3>Thanh toán vào nợ tổng</h3>
              <div className="form-group">
                <label>Chọn nhân viên:</label>
                <select 
                  value={paymentForm.user_id} 
                  onChange={(e) => setPaymentForm({...paymentForm, user_id: e.target.value})}
                >
                  <option value="">Chọn nhân viên</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.username}) - {user.branch?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Số tiền thanh toán:</label>
                <input 
                  type="number" 
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  placeholder="Nhập số tiền thanh toán (VND)"
                />
              </div>
              <div className="form-group">
                <label>Mô tả:</label>
                <input 
                  type="text" 
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                  placeholder="Mô tả thanh toán"
                />
              </div>
              <div className="form-group">
                <label>Ngày thanh toán:</label>
                <input 
                  type="date" 
                  value={paymentForm.transaction_date}
                  onChange={(e) => setPaymentForm({...paymentForm, transaction_date: e.target.value})}
                />
              </div>
              <button onClick={createPayment} className="btn-primary">
                Thanh toán
              </button>
              
              <div className="payment-note">
                <h4>📝 Lưu ý về thanh toán:</h4>
                <ul>
                  <li>Thanh toán sẽ được cộng trực tiếp vào số nợ tổng của nhân viên</li>
                  <li>Không cần chọn khoản tạm ứng cụ thể</li>
                  <li>Số nợ dương = nhân viên đang nợ, số âm = nhân viên đã trả thừa</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancePaymentPage; 