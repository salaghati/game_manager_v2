import React, { useState, useEffect } from 'react';
import './WarehouseManagementPage.css';
import API_CONFIG from '../config/api';

const WarehouseManagementPage = () => {
  const [stocks, setStocks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [stockInData, setStockInData] = useState({
    product_id: '',
    quantity: ''
  });
  const [refillData, setRefillData] = useState({
    machine_id: '',
    product_id: '',
    quantity: ''
  });

  useEffect(() => {
    fetchStocks();
    fetchMachines();
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

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/machines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Lọc chỉ lấy máy gắp gấu
        const prizeMachines = data.filter(machine => machine.type === 'prize_dispensing');
        setMachines(prizeMachines);
      } else {
        console.error('Không thể lấy danh sách máy');
      }
    } catch (err) {
      console.error('Lỗi kết nối khi lấy danh sách máy');
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

  const handleRefillChange = (e) => {
    const { name, value } = e.target;
    setRefillData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!refillData.machine_id || !refillData.product_id || !refillData.quantity || refillData.quantity <= 0) {
      setError('Vui lòng chọn máy, sản phẩm và nhập số lượng hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/warehouse/refill-machine`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          machine_id: parseInt(refillData.machine_id),
          product_id: parseInt(refillData.product_id),
          quantity: parseInt(refillData.quantity)
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchStocks(); // Refresh kho
        fetchMachines(); // Refresh máy
        setRefillData({ machine_id: '', product_id: '', quantity: '' });
        setShowRefillForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể nhập gấu vào máy');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const resetRefillForm = () => {
    setRefillData({ machine_id: '', product_id: '', quantity: '' });
    setShowRefillForm(false);
    setError('');
  };

  const handleResetWarehouse = async () => {
    if (!window.confirm('⚠️ BẠN CÓ CHẮC MUỐN RESET TẤT CẢ HÀNG TỒN KHO VỀ 0?\n\nHành động này KHÔNG THỂ HOÀN TÁC!')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/warehouse/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ ' + result.message);
        fetchStocks(); // Refresh danh sách kho
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể reset kho');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAudits = async () => {
    if (!window.confirm('⚠️ BẠN CÓ CHẮC MUỐN RESET TẤT CẢ DỮ LIỆU KIỂM KÊ MÁY GẤU BÔNG?\n\nBao gồm:\n- Tất cả lịch sử kiểm kê\n- Số lượng quà trong tất cả máy gấu về 0\n\nHành động này KHÔNG THỂ HOÀN TÁC!')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/audits/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ ' + result.message);
        fetchMachines(); // Refresh danh sách máy
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể reset kiểm kê');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
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
        <div className="header-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setShowStockInForm(true)}
            disabled={loading || stocks.length === 0}
          >
            Nhập Kho
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowRefillForm(true)}
            disabled={loading || machines.length === 0}
          >
            Nhập Gấu Vào Máy
          </button>
        </div>
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

      {showRefillForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>Nhập Gấu Vào Máy</h2>
            <form onSubmit={handleRefillSubmit}>
              <div className="form-group">
                <label>Máy Gắp Gấu *</label>
                <select
                  name="machine_id"
                  value={refillData.machine_id}
                  onChange={handleRefillChange}
                  required
                >
                  <option value="">Chọn máy</option>
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} (Hiện tại: {machine.current_quantity || 0}/{machine.standard_quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sản Phẩm *</label>
                <select
                  name="product_id"
                  value={refillData.product_id}
                  onChange={handleRefillChange}
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
                <label>Số Lượng Gấu *</label>
                <input
                  type="number"
                  name="quantity"
                  value={refillData.quantity}
                  onChange={handleRefillChange}
                  min="1"
                  required
                />
                <small>Sẽ được lấy từ kho và đưa vào máy</small>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetRefillForm} disabled={loading}>
                  Hủy
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Đang nhập...' : 'Nhập Vào Máy'}
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

      {/* Section Thao Tác Nguy Hiểm */}
      <div className="danger-zone">
        <h2>⚠️ Thao Tác Nguy Hiểm</h2>
        <div className="danger-actions">
          <div className="danger-item">
            <div className="danger-description">
              <h3>Reset Hàng Tồn Kho</h3>
              <p>Đưa tất cả sản phẩm trong kho về số lượng 0. Thường dùng khi bắt đầu lại hệ thống hoặc kiểm kê tổng thể.</p>
            </div>
            <button 
              className="btn btn-danger"
              onClick={handleResetWarehouse}
              disabled={loading}
            >
              Reset Kho
            </button>
          </div>
          
          <div className="danger-item">
            <div className="danger-description">
              <h3>Reset Dữ Liệu Kiểm Kê Máy Gấu</h3>
              <p>Xóa tất cả lịch sử kiểm kê và đưa số lượng quà trong máy về 0. Dùng khi muốn bắt đầu lại hoàn toàn cho máy gấu bông.</p>
            </div>
            <button 
              className="btn btn-danger"
              onClick={handleResetAudits}
              disabled={loading}
            >
              Reset Kiểm Kê
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseManagementPage;
