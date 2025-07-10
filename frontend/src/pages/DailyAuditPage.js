import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DailyAuditPage.css';
import API_CONFIG from '../config/api';

const DailyAuditPage = () => {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditData, setAuditData] = useState({
    start_of_day_count: '',
    end_of_day_count: '',
    end_of_day_coins: '',
    coin_value: 1000,
    gift_cost: 50000
  });

  useEffect(() => {
    fetchMachine();
  }, [machineId]);

  const fetchMachine = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/machines/${machineId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.type !== 'prize_dispensing') {
          setError('Máy này không phải máy gấu bông');
          return;
        }
        setMachine(data);
        // Cập nhật số gấu đầu ngày từ current_quantity của máy
        setAuditData(prev => ({
          ...prev,
          start_of_day_count: data.current_quantity || 0
        }));
        setError('');
      } else {
        setError('Không thể lấy thông tin máy');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAuditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auditData.start_of_day_count || auditData.start_of_day_count < 0) {
      setError('Vui lòng nhập số lượng gấu đầu ngày hợp lệ');
      return;
    }

    if (!auditData.end_of_day_count || auditData.end_of_day_count < 0) {
      setError('Vui lòng nhập số lượng gấu cuối ngày hợp lệ');
      return;
    }

    if (parseInt(auditData.end_of_day_count) > parseInt(auditData.start_of_day_count)) {
      setError('Số lượng cuối ngày không thể lớn hơn số lượng đầu ngày');
      return;
    }

    if (!auditData.end_of_day_coins || auditData.end_of_day_coins < 0) {
      setError('Vui lòng nhập số xu cuối ngày hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/audits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          machine_id: parseInt(machineId),
          start_of_day_count: parseInt(auditData.start_of_day_count),
          end_of_day_count: parseInt(auditData.end_of_day_count),
          end_of_day_coins: parseInt(auditData.end_of_day_coins),
          coin_value: parseFloat(auditData.coin_value),
          gift_cost: parseFloat(auditData.gift_cost)
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Kiểm kê thành công! Số gấu hiện tại của máy đã được cập nhật.');
        navigate('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể thực hiện kiểm kê');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const calculateGiftsWon = () => {
    if (!auditData.start_of_day_count || !auditData.end_of_day_count) return 0;
    return Math.max(0, parseInt(auditData.start_of_day_count) - parseInt(auditData.end_of_day_count));
  };

  const calculateRevenue = () => {
    if (!auditData.end_of_day_coins || !auditData.coin_value || !auditData.gift_cost) return 0;
    const coinsRevenue = parseInt(auditData.end_of_day_coins) * parseFloat(auditData.coin_value);
    const giftsCost = calculateGiftsWon() * parseFloat(auditData.gift_cost);
    return coinsRevenue - giftsCost;
  };

  if (loading && !machine) {
    return <div className="loading-page">Đang tải thông tin máy...</div>;
  }

  if (error && !machine) {
    return (
      <div className="error-page">
        <h2>Có lỗi xảy ra</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Quay lại trang chính
        </button>
      </div>
    );
  }

  return (
    <div className="daily-audit-page">
      <div className="page-header">
        <h1>Kiểm Kê Hàng Ngày</h1>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-secondary"
          disabled={loading}
        >
          Quay lại
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {machine && (
        <div className="machine-info">
          <h2>Thông Tin Máy</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Tên Máy:</label>
              <span>{machine.name}</span>
            </div>
            <div className="info-item">
              <label>Mã Máy:</label>
              <span>{machine.machine_code}</span>
            </div>
            <div className="info-item">
              <label>Loại:</label>
              <span>Máy gấu bông</span>
            </div>
            <div className="info-item">
              <label>Số lượng tiêu chuẩn:</label>
              <span>{machine.standard_quantity} quà</span>
            </div>
            <div className="info-item">
              <label>Sản phẩm:</label>
              <span>ID #{machine.product_id}</span>
            </div>
          </div>
        </div>
      )}

      <div className="audit-form-container">
        <h2>Thực Hiện Kiểm Kê</h2>
        <form onSubmit={handleSubmit} className="audit-form">
          <div className="form-section">
            <h3>Thông Tin Kiểm Kê</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Số lượng đầu ngày</label>
                <input
                  type="number"
                  name="start_of_day_count"
                  value={auditData.start_of_day_count}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
                <small>Số lượng gấu có trong máy vào đầu ngày (có thể chỉnh sửa nếu cần)</small>
              </div>
              
              <div className="form-group">
                <label>Số lượng cuối ngày *</label>
                <input
                  type="number"
                  name="end_of_day_count"
                  value={auditData.end_of_day_count}
                  onChange={handleInputChange}
                  min="0"
                  max={auditData.start_of_day_count || 100}
                  required
                />
                <small>Số lượng gấu còn lại trong máy cuối ngày</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Số xu cuối ngày *</label>
                <input
                  type="number"
                  name="end_of_day_coins"
                  value={auditData.end_of_day_coins}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
                <small>Tổng số xu thu được cuối ngày</small>
              </div>
              
              <div className="form-group">
                <label>Giá trị mỗi xu (VND) *</label>
                <input
                  type="number"
                  name="coin_value"
                  value={auditData.coin_value}
                  onChange={handleInputChange}
                  min="100"
                  step="100"
                  required
                />
                <small>Giá tiền của 1 xu</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Giá vốn mỗi gấu (VND) *</label>
                <input
                  type="number"
                  name="gift_cost"
                  value={auditData.gift_cost}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  required
                />
                <small>Chi phí gấu bông (để tính lợi nhuận)</small>
              </div>
            </div>

            {auditData.start_of_day_count && auditData.end_of_day_count && (
              <div className="calculation-section">
                <h4>Kết Quả Tính Toán</h4>
                <div className="calculation-grid">
                  <div className="calc-item">
                    <label>Số gấu đã thắng:</label>
                    <span className="calc-value">
                      {calculateGiftsWon()} gấu
                    </span>
                  </div>
                  <div className="calc-item">
                    <label>Doanh thu từ xu:</label>
                    <span className="calc-value">
                      {(parseInt(auditData.end_of_day_coins || 0) * parseFloat(auditData.coin_value || 0)).toLocaleString()} VND
                    </span>
                  </div>
                  <div className="calc-item">
                    <label>Chi phí gấu bông:</label>
                    <span className="calc-value">
                      {(calculateGiftsWon() * parseFloat(auditData.gift_cost || 0)).toLocaleString()} VND
                    </span>
                  </div>
                  <div className="calc-item total-revenue">
                    <label>Doanh thu ròng:</label>
                    <span className="calc-value">
                      {calculateRevenue().toLocaleString()} VND
                    </span>
                  </div>
                  <div className="calc-item">
                    <label>Công thức doanh thu:</label>
                    <span className="calc-formula">
                      ({auditData.end_of_day_coins} xu × {parseInt(auditData.coin_value || 0).toLocaleString()} VND) - ({calculateGiftsWon()} gấu × {parseInt(auditData.gift_cost || 0).toLocaleString()} VND) = {calculateRevenue().toLocaleString()} VND
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              disabled={loading}
              className="btn btn-secondary"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading || !auditData.start_of_day_count || !auditData.end_of_day_count || !auditData.end_of_day_coins}
              className="btn btn-primary"
            >
              {loading ? 'Đang xử lý...' : 'Hoàn Tất Kiểm Kê'}
            </button>
          </div>
        </form>

        <div className="audit-info">
          <h3>Lưu Ý</h3>
          <ul>
            <li>Số lượng cuối ngày không được lớn hơn số lượng đầu ngày</li>
            <li>Hệ thống sẽ tự động tính số gấu đã thắng = Số lượng đầu ngày - Số lượng cuối ngày</li>
            <li>Sau kiểm kê, số gấu hiện tại của máy sẽ được cập nhật theo số lượng cuối ngày</li>
            <li>Để refill máy, vui lòng sử dụng chức năng "Nhập gấu vào máy" ở trang Quản lý kho</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyAuditPage;
