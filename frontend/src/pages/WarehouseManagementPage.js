import React, { useState, useEffect } from 'react';
import './WarehouseManagementPage.css';
import API_CONFIG from '../config/api';

const WarehouseManagementPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [stockInData, setStockInData] = useState({
    product_id: '',
    quantity: ''
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/warehouse`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStocks(data);
        setError('');
      } else {
        setError('Không thể lấy dữ liệu tồn kho');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleStockInChange = (e) => {
    const { name, value } = e.target;
    setStockInData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockInData.product_id || !stockInData.quantity || stockInData.quantity <= 0) {
      setError('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/warehouse/stock-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: parseInt(stockInData.product_id),
          quantity: parseInt(stockInData.quantity)
        })
      });

      if (response.ok) {
        fetchStocks();
        setStockInData({ product_id: '', quantity: '' });
        setShowStockInForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể nhập kho');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const resetStockInForm = () => {
    setStockInData({ product_id: '', quantity: '' });
    setShowStockInForm(false);
    setError('');
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity < 10) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (quantity) => {
    if (quantity === 0) return 'Hết hàng';
    if (quantity < 10) return 'Sắp hết';
    return 'Còn hàng';
  };

  return (
    <div className="warehouse-management-page">
      <div className="page-header">
        <h1>Quản Lý Kho</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowStockInForm(true)}
          disabled={loading || stocks.length === 0}
        >
          Nhập Kho
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showStockInForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>Nhập Hàng Vào Kho</h2>
            <form onSubmit={handleStockInSubmit}>
              <div className="form-group">
                <label>Sản Phẩm *</label>
                <select
                  name="product_id"
                  value={stockInData.product_id}
                  onChange={handleStockInChange}
                  required
                >
                  <option value="">Chọn sản phẩm</option>
                  {stocks.map(stock => (
                    <option key={stock.product_id} value={stock.product_id}>
                      {stock.product?.name} (Hiện tại: {stock.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Số Lượng Nhập *</label>
                <input
                  type="number"
                  name="quantity"
                  value={stockInData.quantity}
                  onChange={handleStockInChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetStockInForm} disabled={loading}>
                  Hủy
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Đang nhập...' : 'Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="stocks-list">
        <h2>Tình Trạng Tồn Kho</h2>
        {loading && <div className="loading">Đang tải...</div>}
        
        {stocks.length === 0 && !loading ? (
          <div className="no-data">
            <p>Chưa có sản phẩm nào trong kho</p>
            <p>Vui lòng tạo sản phẩm trước tại trang <strong>Quản Lý Sản Phẩm</strong></p>
          </div>
        ) : (
          <div className="stocks-table">
            <table>
              <thead>
                <tr>
                  <th>Sản Phẩm</th>
                  <th>Giá</th>
                  <th>Số Lượng Tồn</th>
                  <th>Trạng Thái</th>
                  <th>Giá Trị Tồn Kho</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => (
                  <tr key={stock.product_id}>
                    <td className="product-name">{stock.product?.name || 'N/A'}</td>
                    <td className="price">
                      {stock.product?.price ? 
                        new Intl.NumberFormat('vi-VN').format(stock.product.price) + ' VND' : 
                        'N/A'
                      }
                    </td>
                    <td className="quantity">{stock.quantity}</td>
                    <td className="status">
                      <span className={`status-badge ${getStockStatus(stock.quantity)}`}>
                        {getStockStatusText(stock.quantity)}
                      </span>
                    </td>
                    <td className="total-value">
                      {stock.product?.price ? 
                        new Intl.NumberFormat('vi-VN').format(stock.quantity * stock.product.price) + ' VND' :
                        'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="summary">
              <div className="summary-item">
                <strong>Tổng số sản phẩm: </strong>
                {stocks.reduce((total, stock) => total + stock.quantity, 0)}
              </div>
              <div className="summary-item">
                <strong>Tổng giá trị kho: </strong>
                {new Intl.NumberFormat('vi-VN').format(
                  stocks.reduce((total, stock) => 
                    total + (stock.quantity * (stock.product?.price || 0)), 0
                  )
                )} VND
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseManagementPage;
