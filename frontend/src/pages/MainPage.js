import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api';

// Import new pages for prize machine features
import ProductManagementPage from './ProductManagementPage';
import WarehouseManagementPage from './WarehouseManagementPage';
import ReportsPage from './ReportsPage';

// Component con để quản lý việc nhập liệu và tính toán
function PointEntryForm({ machine, date, token, onSave, yesterdayBalance, disabled }) {
  const [pointsIn, setPointsIn] = useState('');
  const [pointsOut, setPointsOut] = useState('');
  const [manualYesterdayBalance, setManualYesterdayBalance] = useState('');
  const [error, setError] = useState('');

  // Validation input
  const handlePointChange = (value, setter) => {
    if (value === '' || value < 0) {
      setter('');
      return;
    }
    setter(parseInt(value));
  };

  // Tính toán các giá trị
  const pointBalance = useMemo(() => {
    const pIn = parseInt(pointsIn) || 0;
    const pOut = parseInt(pointsOut) || 0;
    return pIn - pOut;
  }, [pointsIn, pointsOut]);

  const dailyPoint = useMemo(() => {
    if (yesterdayBalance === null) {
      const prevBalance = parseInt(manualYesterdayBalance) || 0;
      return pointBalance - prevBalance;
    }
    return pointBalance - (yesterdayBalance || 0);
  }, [pointBalance, yesterdayBalance, manualYesterdayBalance]);

  const finalAmount = useMemo(() => {
    const rate = machine?.rate || 2; // Mặc định rate là 2 nếu không có
    return (dailyPoint / rate) * 1000;
  }, [dailyPoint, machine]);

  const handleSave = () => {
    // Reset error
    setError('');

    // Validation
    if (pointsIn === '' || pointsOut === '') {
      setError('Vui lòng nhập đầy đủ Point In và Point Out');
      return;
    }

    if (yesterdayBalance === null && manualYesterdayBalance === '') {
      setError('Vui lòng nhập Point Balance của ngày hôm qua');
      return;
    }

    const dataToSave = {
      machine_id: machine.id,
      transaction_date: date,
      points_in: parseInt(pointsIn) || 0,
      points_out: parseInt(pointsOut) || 0,
      current_balance: pointBalance,
      previous_balance: yesterdayBalance !== null ? yesterdayBalance : parseInt(manualYesterdayBalance) || 0,
      daily_point: dailyPoint,
      final_amount: finalAmount
    };
    onSave(dataToSave);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>Point In: </label>
        <input 
          type="number" 
          value={pointsIn} 
          onChange={e => handlePointChange(e.target.value, setPointsIn)}
          min="0"
          style={{ width: '100%', padding: 8 }}
          disabled={disabled}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Point Out: </label>
        <input 
          type="number" 
          value={pointsOut} 
          onChange={e => handlePointChange(e.target.value, setPointsOut)}
          min="0"
          style={{ width: '100%', padding: 8 }}
          disabled={disabled}
        />
      </div>
      {yesterdayBalance === null && (
        <div style={{ marginBottom: 12 }}>
          <label>Point Balance (hôm qua): </label>
          <input 
            type="number" 
            value={manualYesterdayBalance} 
            onChange={e => handlePointChange(e.target.value, setManualYesterdayBalance)}
            min="0"
            style={{ width: '100%', padding: 8 }}
            disabled={disabled}
            placeholder="Nhập point balance của ngày hôm qua"
          />
        </div>
      )}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <p><strong>Point Balance (hôm nay):</strong> {pointBalance}</p>
      {yesterdayBalance !== null && (
        <p><strong>Point Balance (hôm qua):</strong> {yesterdayBalance}</p>
      )}
      <hr />
      <p><strong>Daily Point:</strong> {dailyPoint}</p>
      <p><strong>Rate hiện tại:</strong> x{machine?.rate || 2}</p>
      <p><strong>Final Amount (Thành tiền):</strong> {finalAmount.toLocaleString('vi-VN')} VNĐ</p>
      <button 
        onClick={handleSave} 
        style={{ 
          padding: 10, 
          cursor: 'pointer',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          width: '100%',
          opacity: disabled ? 0.5 : 1
        }}
        disabled={disabled}
      >
        Lưu dữ liệu
      </button>
    </div>
  );
}

// Component quản lý chi nhánh
function BranchManagement({ token }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy danh sách chi nhánh
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_CONFIG.BASE_URL}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách chi nhánh", error);
      if (error.response?.status === 401) {
        // Token hết hạn
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError('Không thể lấy danh sách chi nhánh');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBranches();
  }, [token, fetchBranches]);

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', manager_name: '' });
    setEditingBranch(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingBranch) {
        // Update chi nhánh
        await axios.put(`${API_CONFIG.BASE_URL}/api/branches/${editingBranch.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật chi nhánh thành công!');
      } else {
        // Tạo chi nhánh mới
        await axios.post(`${API_CONFIG.BASE_URL}/api/branches`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Tạo chi nhánh mới thành công!');
      }
      
      fetchBranches();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Xử lý edit
  const handleEdit = (branch) => {
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || '',
      manager_name: branch.manager_name || ''
    });
    setEditingBranch(branch);
    setShowForm(true);
  };

  // Xử lý delete
  const handleDelete = async (branch) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chi nhánh "${branch.name}"?\n\nLưu ý: Đây là xóa mềm, chi nhánh sẽ được ẩn khỏi danh sách nhưng dữ liệu vẫn được bảo lưu trong hệ thống.\n\nTrước khi xóa, vui lòng xóa tất cả máy trong chi nhánh này.`)) {
      return;
    }

    try {
      await axios.delete(`${API_CONFIG.BASE_URL}/api/branches/${branch.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Xóa chi nhánh thành công!');
      fetchBranches();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa chi nhánh');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Quản lý chi nhánh</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Hủy' : 'Thêm chi nhánh mới'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 10, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 4 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 10, padding: 10, backgroundColor: '#e6ffe6', borderRadius: 4 }}>{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ 
          marginBottom: 20, 
          padding: 20, 
          border: '1px solid #ddd', 
          borderRadius: 4,
          backgroundColor: '#f9f9f9'
        }}>
          <h3>{editingBranch ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}</h3>
          <div style={{ marginBottom: 12 }}>
            <label>Tên chi nhánh: </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Địa chỉ: </label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Số điện thoại: </label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Tên quản lý: </label>
            <input 
              type="text" 
              value={formData.manager_name}
              onChange={e => setFormData({...formData, manager_name: e.target.value})}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {editingBranch ? 'Cập nhật' : 'Tạo chi nhánh'}
            </button>
            <button 
              type="button"
              onClick={resetForm}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Tên chi nhánh</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Địa chỉ</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Số điện thoại</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Quản lý</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(branch => (
              <tr key={branch.id}>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{branch.name}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{branch.address}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{branch.phone || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{branch.manager_name || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>
                  <button 
                    onClick={() => handleEdit(branch)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginRight: 5
                    }}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(branch)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Component quản lý máy game
function MachineManagement({ token }) {
  const [machines, setMachines] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState({
    machine_code: '',
    name: '',
    rate: 2,
    branch_id: '',
    type: 'point_in_out',
    standard_quantity: '',
    product_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy danh sách máy
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_CONFIG.BASE_URL}/api/machines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMachines(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách máy", error);
      if (error.response?.status === 401) {
        // Token hết hạn
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError('Không thể lấy danh sách máy');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Lấy danh sách chi nhánh
  const fetchBranches = useCallback(async () => {
    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách chi nhánh", error);
      // Nếu không lấy được chi nhánh, có thể user không phải admin
    }
  }, [token]);

  // Lấy danh sách sản phẩm
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm", error);
    }
  }, [token]);

  useEffect(() => {
    fetchMachines();
    fetchBranches();
    fetchProducts();
  }, [token, fetchMachines, fetchBranches, fetchProducts]);

  // Reset form
  const resetForm = () => {
    setFormData({ 
      machine_code: '', 
      name: '', 
      rate: 2, 
      branch_id: '',
      type: 'point_in_out',
      standard_quantity: '',
      product_id: ''
    });
    setEditingMachine(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingMachine) {
        // Update máy
        await axios.put(`${API_CONFIG.BASE_URL}/api/machines/${editingMachine.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật máy thành công!');
      } else {
        // Tạo máy mới
        await axios.post(`${API_CONFIG.BASE_URL}/api/machines`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Tạo máy mới thành công!');
      }
      
      fetchMachines();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Xử lý edit
  const handleEdit = (machine) => {
    setFormData({
      machine_code: machine.machine_code,
      name: machine.name,
      rate: machine.rate,
      branch_id: machine.branch_id,
      type: machine.type || 'point_in_out',
      standard_quantity: machine.standard_quantity || '',
      product_id: machine.product_id || ''
    });
    setEditingMachine(machine);
    setShowForm(true);
  };

  // Xử lý delete
  const handleDelete = async (machine) => {
    if (!window.confirm(`Bạn có chắc muốn xóa máy "${machine.name}"?\n\nLưu ý: Đây là xóa mềm, máy sẽ được ẩn khỏi danh sách nhưng dữ liệu vẫn được bảo lưu trong hệ thống.`)) {
      return;
    }

    try {
      await axios.delete(`${API_CONFIG.BASE_URL}/api/machines/${machine.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Xóa máy thành công!');
      fetchMachines();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa máy');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Quản lý máy game</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Hủy' : 'Thêm máy mới'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 10, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 4 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 10, padding: 10, backgroundColor: '#e6ffe6', borderRadius: 4 }}>{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ 
          marginBottom: 20, 
          padding: 20, 
          border: '1px solid #ddd', 
          borderRadius: 4,
          backgroundColor: '#f9f9f9'
        }}>
          <h3>{editingMachine ? 'Sửa máy' : 'Thêm máy mới'}</h3>
          <div style={{ marginBottom: 12 }}>
            <label>Mã máy: </label>
            <input 
              type="text" 
              value={formData.machine_code}
              onChange={e => setFormData({...formData, machine_code: e.target.value})}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Tên máy: </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Chi nhánh: </label>
            <select 
              value={formData.branch_id}
              onChange={e => setFormData({...formData, branch_id: parseInt(e.target.value)})}
              required
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">-- Chọn chi nhánh --</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.address})
                </option>
              ))}
            </select>
            <small style={{ color: '#666' }}>
              {editingMachine ? 'Chọn chi nhánh khác để di chuyển máy' : 'Chọn chi nhánh cho máy mới'}
            </small>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Tỉ lệ cược (Rate): </label>
            <input 
              type="number" 
              step="0.1"
              value={formData.rate}
              onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || ''})}
              min="0.1"
              required
              style={{ width: '100%', padding: 8 }}
              placeholder="Ví dụ: 2, 2.5, 3, 4"
            />
            <small style={{ color: '#666' }}>
              Công thức: Final Amount = (Daily Point / Rate) x 1000<br/>
              <strong>⚠️ Lưu ý:</strong> Thay đổi rate chỉ ảnh hưởng đến các giao dịch mới, không ảnh hưởng đến dữ liệu đã lưu
            </small>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Loại máy: </label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value, standard_quantity: '', product_id: ''})}
              required
              style={{ width: '100%', padding: 8 }}
            >
              <option value="point_in_out">Máy tính điểm (Point In/Out)</option>
              <option value="prize_dispensing">Máy gắp quà (Prize Dispensing)</option>
            </select>
            <small style={{ color: '#666' }}>
              Chọn loại máy để xác định cách thức hoạt động
            </small>
          </div>

          {/* Các field đặc biệt cho máy gắp quà */}
          {formData.type === 'prize_dispensing' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Sản phẩm quà: </label>
                <select 
                  value={formData.product_id}
                  onChange={e => setFormData({...formData, product_id: parseInt(e.target.value)})}
                  required
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {new Intl.NumberFormat('vi-VN').format(product.price)} VND
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666' }}>
                  Chọn loại quà mà máy này sẽ phát
                </small>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label>Số lượng tiêu chuẩn: </label>
                <input 
                  type="number" 
                  value={formData.standard_quantity}
                  onChange={e => setFormData({...formData, standard_quantity: parseInt(e.target.value) || ''})}
                  min="1"
                  required
                  style={{ width: '100%', padding: 8 }}
                  placeholder="Ví dụ: 50, 100, 200"
                />
                <small style={{ color: '#666' }}>
                  Số lượng quà tối đa mà máy có thể chứa (được nạp vào đầu ngày)
                </small>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {editingMachine ? 'Cập nhật' : 'Tạo máy'}
            </button>
            <button 
              type="button"
              onClick={resetForm}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Mã máy</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Tên máy</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Loại máy</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Chi nhánh</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Tỉ lệ cược</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Chi tiết</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {machines.map(machine => (
              <tr key={machine.id}>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{machine.machine_code}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{machine.name}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: machine.type === 'prize_dispensing' ? '#ff9800' : '#4caf50',
                    color: 'white'
                  }}>
                    {machine.type === 'prize_dispensing' ? 'Máy gấu bông' : 'Máy tính điểm'}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>
                  {machine.branch ? (
                    <div>
                      <strong>{machine.branch.name}</strong><br/>
                      <small style={{ color: '#666' }}>{machine.branch.address}</small>
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>Chưa có thông tin</span>
                  )}
                </td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>x{machine.rate}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>
                  {machine.type === 'prize_dispensing' ? (
                    <div>
                      <div><strong>Sản phẩm:</strong> {machine.product_name || 'N/A'}</div>
                      <div><strong>Số gấu hiện tại:</strong> {machine.current_quantity || 0}</div>
                    </div>
                  ) : (
                    <div><strong>Điểm hiện tại:</strong> {machine.current_points || 0}</div>
                  )}
                </td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>
                  <button 
                    onClick={() => handleEdit(machine)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginRight: 5
                    }}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(machine)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Component nhập liệu dữ liệu  
function DataEntry({ token }) {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState([]);
  const [yesterdayBalance, setYesterdayBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({
    points_in: '',
    points_out: '',
    previous_balance: '',
    current_balance: ''
  });
  const [demoMode, setDemoMode] = useState(true); // True = cho phép sửa ngày đã nhập (demo), False = block ngày đã nhập
  const [filterDate, setFilterDate] = useState(''); // Filter ngày cho bảng lịch sử
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTransactionId, setLogTransactionId] = useState(null);
  const [editLogs, setEditLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState('');

  // Lấy danh sách máy khi load
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_CONFIG.BASE_URL}/api/machines`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Chỉ hiển thị máy thường (không phải máy gấu bông) trong tab nhập liệu
        const regularMachines = (res.data || []).filter(m => m.type !== 'prize_dispensing');
        setMachines(regularMachines);
        if (regularMachines && regularMachines.length > 0) setSelectedMachineId(regularMachines[0].id);
      } catch (error) {
        console.error("Lỗi lấy danh sách máy", error);
        if (error.response?.status === 401) {
          // Token hết hạn
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          setError('Không thể lấy danh sách máy');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [token]);

  // Lấy dữ liệu tham chiếu (ngày hôm qua) và lịch sử khi thay đổi máy hoặc ngày
  useEffect(() => {
    if (!selectedMachineId || !selectedDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Lấy balance ngày hôm qua
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        // Lấy giao dịch đầu tiên để kiểm tra
        const [firstTransactionRes, yesterdayRes, historyRes] = await Promise.all([
          axios.get(`${API_CONFIG.BASE_URL}/api/history`, {
            params: { machine_id: selectedMachineId, limit: 1 },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_CONFIG.BASE_URL}/api/point`, {
            params: { machine_id: selectedMachineId, date: yesterdayStr },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_CONFIG.BASE_URL}/api/history`, {
            params: { machine_id: selectedMachineId, limit: 30 },
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const isFirstDay = !firstTransactionRes.data.length || 
                         new Date(selectedDate) <= new Date(firstTransactionRes.data[0].transaction_date);

        if (isFirstDay) {
          setYesterdayBalance(null);
          setError(''); // Cho phép nhập dữ liệu ngày đầu tiên
        } else if (!yesterdayRes.data) {
          setError(`Chưa có dữ liệu của ngày ${yesterdayStr}. Vui lòng nhập dữ liệu theo thứ tự ngày.`);
          setYesterdayBalance(null);
        } else {
          setYesterdayBalance(yesterdayRes.data.current_balance);
          setError('');
        }
        
        setHistory(historyRes.data || []);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu", err);
        setError('Không thể lấy dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMachineId, selectedDate, token]);

  // Kiểm tra ngày đã nhập dữ liệu chưa
  const checkDateAlreadyEntered = async (machineId, date) => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/point`, {
        params: { machine_id: machineId, date: date },
        headers: { Authorization: `Bearer ${token}` }
      });
      return !!response.data; // Trả về true nếu đã có dữ liệu
    } catch (error) {
      return false;
    }
  };

  // Hàm lưu dữ liệu
  const handleSaveData = async (data) => {
    try {
      setLoading(true);
      setError('');

      // Kiểm tra nếu không phải demo mode và ngày đã nhập
      if (!demoMode) {
        const alreadyEntered = await checkDateAlreadyEntered(data.machine_id, data.transaction_date);
        if (alreadyEntered) {
          setError('⚠️ Ngày này đã nhập dữ liệu rồi! Bật chế độ Demo để chỉnh sửa.');
          return;
        }
      }

      await axios.post(`${API_CONFIG.BASE_URL}/api/point`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Hiển thị thông báo thành công
      alert('Lưu dữ liệu thành công!');
      
      // Tải lại dữ liệu
      const [historyRes, currentPoint] = await Promise.all([
        axios.get(`${API_CONFIG.BASE_URL}/api/history`, {
          params: { machine_id: selectedMachineId, limit: 30 },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_CONFIG.BASE_URL}/api/point`, {
          params: { 
            machine_id: selectedMachineId, 
            date: selectedDate
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setHistory(historyRes.data);
      if (currentPoint.data) {
        setYesterdayBalance(currentPoint.data.previous_balance);
      }
    } catch (error) {
      // Hiển thị thông báo lỗi chi tiết
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
      setError(errorMessage);
      
      if (error.response?.status === 401) {
        // Token hết hạn
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm reset dữ liệu
  const handleReset = async () => {
    if (window.confirm('Bạn có chắc muốn xóa TOÀN BỘ lịch sử của máy này?')) {
      try {
        await axios.delete(`${API_CONFIG.BASE_URL}/api/history`, {
          params: { machine_id: selectedMachineId },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // ✅ CRITICAL FIX: Reset all cached data
        setHistory([]);
        setYesterdayBalance(null); // 🔥 Reset yesterday balance cache!
        setError(''); // Clear any errors
        
        alert('Reset thành công! Dữ liệu máy đã được xóa hoàn toàn.');
      } catch (error) {
        console.error('Reset error:', error);
        alert('Reset thất bại');
      }
    }
  };

  // Hàm bắt đầu edit transaction
  const handleStartEdit = (transaction) => {
    setEditingTransaction(transaction.id);
    setEditForm({
      points_in: transaction.points_in,
      points_out: transaction.points_out,
      previous_balance: transaction.previous_balance,
      current_balance: transaction.current_balance
    });
  };

  // Hàm hủy edit
  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditForm({
      points_in: '',
      points_out: '',
      previous_balance: '',
      current_balance: ''
    });
  };

  // Hàm lưu edit transaction
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      // Chỉ gửi các trường cần thiết, không gửi final_amount vì backend sẽ tự tính
      const requestData = {
        points_in: editForm.points_in,
        points_out: editForm.points_out,
        previous_balance: editForm.previous_balance,
        current_balance: editForm.current_balance
      };
      
      const response = await axios.put(`${API_CONFIG.BASE_URL}/api/transactions/${editingTransaction}`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cập nhật lịch sử với dữ liệu mới
      const updatedHistory = history.map(h => 
        h.id === editingTransaction ? response.data : h
      );
      setHistory(updatedHistory);
      
      setEditingTransaction(null);
      alert('Cập nhật thành công!');
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  // Filter history theo ngày nếu có filterDate
  const filteredHistory = useMemo(() => {
    if (!filterDate) return history;
    return history.filter(h => {
      const transactionDate = new Date(h.transaction_date).toISOString().slice(0, 10);
      return transactionDate === filterDate;
    });
  }, [history, filterDate]);
  
  const selectedMachine = machines && machines.length > 0 ? machines.find(m => m.id === parseInt(selectedMachineId)) : null;

  // Tự động cập nhật current_balance, daily_point, final_amount khi chỉnh Point In/Out ở chế độ edit
  useEffect(() => {
    if (editingTransaction !== null) {
      const pointsIn = parseInt(editForm.points_in) || 0;
      const pointsOut = parseInt(editForm.points_out) || 0;
      const prevBalance = parseInt(editForm.previous_balance) || 0;
      // Tính lại balance hôm nay
      const newCurrentBalance = pointsIn - pointsOut;
      // Nếu current_balance khác với giá trị mới thì cập nhật
      if (editForm.current_balance !== newCurrentBalance) {
        setEditForm((prev) => ({
          ...prev,
          current_balance: newCurrentBalance
        }));
      }
    }
    // eslint-disable-next-line
  }, [editForm.points_in, editForm.points_out, editingTransaction]);

  const handleShowLog = async (transactionId) => {
    setShowLogModal(true);
    setLogTransactionId(transactionId);
    setLogLoading(true);
    setLogError('');
    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}/api/transaction-edit-logs`, {
        params: { transaction_id: transactionId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditLogs(res.data || []);
    } catch (err) {
      setLogError('Không thể tải lịch sử chỉnh sửa');
      setEditLogs([]);
    } finally {
      setLogLoading(false);
    }
  };

  const handleCloseLog = () => {
    setShowLogModal(false);
    setLogTransactionId(null);
    setEditLogs([]);
    setLogError('');
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 16, color: '#333' }}>✏️ Nhập liệu điểm máy</h2>
      
      <div style={{ 
        padding: 16, 
        backgroundColor: '#e8f5e8', 
        borderRadius: 8, 
        marginBottom: 20,
        border: '1px solid #c8e6c9'
      }}>
        <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: 8 }}>
          ℹ️ Thông tin quan trọng:
        </div>
        <div style={{ color: '#388e3c', fontSize: 14 }}>
          • Tab này dành cho <strong>máy thường</strong> (Point In/Out)<br/>
          • Máy gấu bông sử dụng tab "📋 Kiểm kê hàng ngày" riêng biệt
        </div>
      </div>

      {/* Toggle Demo Mode */}
      <div style={{ 
        marginBottom: 20, 
        padding: 15, 
        backgroundColor: demoMode ? '#e8f5e8' : '#fff3cd', 
        border: `1px solid ${demoMode ? '#28a745' : '#ffc107'}`, 
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>🔧 Chế độ: {demoMode ? 'DEMO' : 'SẢN XUẤT'}</strong>
          <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
            {demoMode 
              ? '✅ Có thể chỉnh sửa/ghi đè ngày đã nhập (dành cho demo và testing)'
              : '🚫 Chặn ghi đè ngày đã nhập (chế độ production)'
            }
          </div>
        </div>
        <button
          onClick={() => setDemoMode(!demoMode)}
          style={{
            padding: '8px 16px',
            backgroundColor: demoMode ? '#28a745' : '#ffc107',
            color: demoMode ? 'white' : '#000',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {demoMode ? 'Chuyển SX' : 'Chuyển Demo'}
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}
      {error && <div style={{ color: 'red', padding: '10px 0', textAlign: 'center' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        <div>
          {/* Cột trái: Chọn máy, ngày và nhập liệu */}
          <div style={{ marginBottom: 16 }}>
            <label>Chọn máy: </label>
            <select 
              value={selectedMachineId} 
              onChange={e => setSelectedMachineId(e.target.value)} 
              style={{width: '100%', padding: 8}}
              disabled={loading}
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.branch ? m.branch.name : 'Chưa có chi nhánh'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Chọn ngày: </label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              style={{width: '100%', padding: 8}}
              disabled={loading}
            />
          </div>
          {/* Form nhập điểm cho máy thường */}
          {selectedMachine && (
            <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
              <h3>Nhập liệu điểm máy</h3>
              <PointEntryForm
                machine={selectedMachine}
                date={selectedDate}
                token={token}
                onSave={handleSaveData}
                yesterdayBalance={yesterdayBalance}
                disabled={loading}
              />
            </div>
          )}
        </div>

        <div>
          {/* Cột phải: Lịch sử và reset */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <h3>Lịch sử nhập liệu</h3>
            <button onClick={handleReset} style={{backgroundColor: 'red', color: 'white', border: 'none', padding: 8, cursor: 'pointer'}}>Reset dữ liệu máy</button>
          </div>
          
          {/* Filter ngày cụ thể */}
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12}}>
            <label>Lọc theo ngày:</label>
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)}
              style={{padding: 6, borderRadius: 4, border: '1px solid #ccc'}}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                Xóa lọc
              </button>
            )}
            <span style={{fontSize: 12, color: '#666'}}>
              {filterDate ? `Hiển thị: ${filteredHistory.length} dòng` : `Tổng: ${history.length} dòng`}
            </span>
          </div>
          <div style={{maxHeight: 500, overflowY: 'auto'}}>
            <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead style={{position: 'sticky', top: 0, backgroundColor: '#f0f0f0'}}>
                <tr>
                  <th>Ngày</th>
                  <th>Chi nhánh</th>
                  <th>Point In</th>
                  <th>Point Out</th>
                  <th>Balance</th>
                  <th>Daily Point</th>
                  <th>Rate</th>
                  <th>Thành tiền (VNĐ)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h, index) => (
                  <tr key={h.id}>
                    <td>{new Date(h.transaction_date).toLocaleDateString('vi-VN')}</td>
                    <td>{selectedMachine?.branch?.name || 'N/A'}</td>
                    <td>
                      {editingTransaction === h.id ? (
                        <input 
                          type="number" 
                          value={editForm.points_in}
                          onChange={e => setEditForm({...editForm, points_in: parseInt(e.target.value) || 0})}
                          style={{ width: '80px', padding: 2 }}
                          min="0"
                        />
                      ) : (
                        h.points_in
                      )}
                    </td>
                    <td>
                      {editingTransaction === h.id ? (
                        <input 
                          type="number" 
                          value={editForm.points_out}
                          onChange={e => setEditForm({...editForm, points_out: parseInt(e.target.value) || 0})}
                          style={{ width: '80px', padding: 2 }}
                          min="0"
                        />
                      ) : (
                        h.points_out
                      )}
                    </td>
                    <td>
                      {editingTransaction === h.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <small style={{ fontSize: 9 }}>Hôm qua:</small>
                          <input 
                            type="number" 
                            value={editForm.previous_balance}
                            onChange={e => setEditForm({...editForm, previous_balance: parseInt(e.target.value) || 0})}
                            style={{ width: '80px', padding: 1, fontSize: 10 }}
                            min="0"
                          />
                          <small style={{ fontSize: 9 }}>Hôm nay:</small>
                          <input 
                            type="number" 
                            value={editForm.current_balance}
                            onChange={e => setEditForm({...editForm, current_balance: parseInt(e.target.value) || 0})}
                            style={{ width: '80px', padding: 1, fontSize: 10 }}
                            min="0"
                          />
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 11 }}>Hôm qua: {h.previous_balance}</div>
                          <div><strong>{h.current_balance}</strong></div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingTransaction === h.id ? (
                        <strong>{(parseInt(editForm.current_balance) || 0) - (parseInt(editForm.previous_balance) || 0)}</strong>
                      ) : (
                        h.daily_point
                      )}
                    </td>
                    <td>
                      <strong>x{h.rate || 2}</strong>
                    </td>
                    <td>
                      {editingTransaction === h.id ? (
                        <strong style={{ color: '#28a745' }}>
                          {(() => {
                            const dailyPoint = (parseInt(editForm.current_balance) || 0) - (parseInt(editForm.previous_balance) || 0);
                            const rate = h.rate || 2;
                            return Math.round((dailyPoint / rate) * 1000).toLocaleString('vi-VN');
                          })()}
                        </strong>
                      ) : (
                        h.final_amount?.toLocaleString('vi-VN')
                      )}
                    </td>
                    <td>
                      {index === 0 && h.id === history[0]?.id ? ( // Chỉ hiển thị Edit cho dòng đầu tiên (mới nhất) trong toàn bộ lịch sử
                        editingTransaction === h.id ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button 
                              onClick={handleSaveEdit}
                              style={{
                                padding: '2px 8px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: 3,
                                cursor: 'pointer',
                                fontSize: 11
                              }}
                              disabled={loading}
                            >
                              Lưu
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              style={{
                                padding: '2px 8px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: 3,
                                cursor: 'pointer',
                                fontSize: 11
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleStartEdit(h)}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: 3,
                              cursor: 'pointer',
                              fontSize: 11
                            }}
                          >
                            Edit
                          </button>
                        )
                      ) : (
                        <span style={{ color: '#999', fontSize: 11 }}>Chỉ sửa được ngày mới nhất</span>
                      )}
                      <button
                        onClick={() => handleShowLog(h.id)}
                        style={{
                          marginLeft: 6,
                          padding: '6px 10px',
                          backgroundColor: '#5c6bc0',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ marginRight: 5 }}>📋</span> Lịch sử chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showLogModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 24, minWidth: 700, maxWidth: 800, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 2px 16px #0002' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 22, borderBottom: '2px solid #2196F3', paddingBottom: 10, color: '#1976d2' }}>Lịch sử chỉnh sửa</h3>
            {logLoading ? (
              <div>Đang tải...</div>
            ) : logError ? (
              <div style={{ color: 'red' }}>{logError}</div>
            ) : editLogs.length === 0 ? (
              <div>Không có chỉnh sửa nào.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ padding: '12px 15px', minWidth: '180px', textAlign: 'left' }}>Thời gian</th>
                    <th style={{ padding: '12px 15px', minWidth: '120px', textAlign: 'left' }}>Người sửa</th>
                    <th style={{ padding: '12px 15px', minWidth: '150px', textAlign: 'left' }}>Trường</th>
                    <th style={{ padding: '12px 15px', minWidth: '100px', textAlign: 'center' }}>Giá trị cũ</th>
                    <th style={{ padding: '12px 15px', minWidth: '100px', textAlign: 'center' }}>Giá trị mới</th>
                  </tr>
                </thead>
                <tbody>
                  {editLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px 15px', textAlign: 'left' }}>{new Date(log.edited_at).toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'left' }}>{log.editor_name}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 'bold' }}>
                        {log.field === 'points_in' ? 'Point In' : 
                         log.field === 'points_out' ? 'Point Out' : 
                         log.field === 'previous_balance' ? 'Balance trước' : 
                         log.field === 'current_balance' ? 'Balance hiện tại' : 
                         log.field}
                      </td>
                      <td style={{ padding: '12px 15px', color: '#888', textAlign: 'center', fontWeight: '500' }}>{log.old_value}</td>
                      <td style={{ padding: '12px 15px', color: '#388e3c', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f1f8e9' }}>{log.new_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={handleCloseLog} style={{ padding: '6px 18px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component Lịch sử nhập với filter range ngày
function HistoryEntry({ token }) {
  // const navigate = useNavigate(); // Tạm thời comment để tránh lỗi unused
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Mặc định 30 ngày trước
    return date.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy danh sách máy khi load
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_CONFIG.BASE_URL}/api/machines`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Chỉ hiển thị máy thường (không phải máy gấu bông) trong tab lịch sử nhập
        const regularMachines = (res.data || []).filter(m => m.type !== 'prize_dispensing');
        setMachines(regularMachines);
        if (regularMachines && regularMachines.length > 0) setSelectedMachineId(regularMachines[0].id);
      } catch (error) {
        console.error("Lỗi lấy danh sách máy", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          setError('Không thể lấy danh sách máy');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [token]);

  // Lấy lịch sử theo range ngày
  useEffect(() => {
    if (!selectedMachineId || !fromDate || !toDate) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_CONFIG.BASE_URL}/api/history`, {
          params: { 
            machine_id: selectedMachineId,
            from_date: fromDate,
            to_date: toDate,
            limit: 1000 // Tăng limit để hiển thị nhiều dữ liệu hơn
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy lịch sử", err);
        setError('Không thể lấy dữ liệu lịch sử. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedMachineId, fromDate, toDate, token]);

  const selectedMachine = machines && machines.length > 0 ? machines.find(m => m.id === parseInt(selectedMachineId)) : null;

  // Tính tổng các chỉ số
  const totals = useMemo(() => {
    return history.reduce((acc, h) => ({
      pointsIn: acc.pointsIn + (h.points_in || 0),
      pointsOut: acc.pointsOut + (h.points_out || 0),
      dailyPoint: acc.dailyPoint + (h.daily_point || 0),
      finalAmount: acc.finalAmount + (h.final_amount || 0)
    }), { pointsIn: 0, pointsOut: 0, dailyPoint: 0, finalAmount: 0 });
  }, [history]);

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 16, color: '#333' }}>📈 Lịch sử nhập liệu theo khoảng thời gian</h2>
      
      <div style={{ 
        padding: 16, 
        backgroundColor: '#e3f2fd', 
        borderRadius: 8, 
        marginBottom: 24,
        border: '1px solid #bbdefb'
      }}>
        <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 8 }}>
          ℹ️ Thông tin quan trọng:
        </div>
        <div style={{ color: '#1976d2', fontSize: 14 }}>
          • Tab này chỉ hiển thị <strong>máy thường</strong> (Point In/Out)<br/>
          • Để xem báo cáo <strong>máy gấu bông</strong>, vui lòng sử dụng tab "📈 Báo cáo"
        </div>
      </div>
      
      {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}
      {error && <div style={{ color: 'red', padding: '10px 0', textAlign: 'center' }}>{error}</div>}

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr auto', 
        gap: 16, 
        marginBottom: 24,
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #e9ecef'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Chọn máy:</label>
          <select 
            value={selectedMachineId} 
            onChange={e => setSelectedMachineId(e.target.value)} 
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            disabled={loading}
          >
            {machines.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} - {m.branch ? m.branch.name : 'Chưa có chi nhánh'}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Từ ngày:</label>
          <input 
            type="date" 
            value={fromDate} 
            onChange={e => setFromDate(e.target.value)} 
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            disabled={loading}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Đến ngày:</label>
          <input 
            type="date" 
            value={toDate} 
            onChange={e => setToDate(e.target.value)} 
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            disabled={loading}
          />
        </div>

        <div style={{ alignSelf: 'end' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#28a745' }}>
            Tổng: {history.length} ngày
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {fromDate} → {toDate}
          </div>
        </div>
      </div>

      {/* Tổng kết */}
      {history.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 16, 
          marginBottom: 24 
        }}>
          <div style={{ 
            padding: 16, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 8, 
            textAlign: 'center',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2' }}>
              {totals.pointsIn.toLocaleString('vi-VN')}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Tổng Point In</div>
          </div>
          
          <div style={{ 
            padding: 16, 
            backgroundColor: '#fce4ec', 
            borderRadius: 8, 
            textAlign: 'center',
            border: '1px solid #f8bbd9'
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#c2185b' }}>
              {totals.pointsOut.toLocaleString('vi-VN')}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Tổng Point Out</div>
          </div>
          
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f3e5f5', 
            borderRadius: 8, 
            textAlign: 'center',
            border: '1px solid #e1bee7'
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#7b1fa2' }}>
              {totals.dailyPoint.toLocaleString('vi-VN')}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Tổng Daily Point</div>
          </div>
          
          <div style={{ 
            padding: 16, 
            backgroundColor: '#e8f5e8', 
            borderRadius: 8, 
            textAlign: 'center',
            border: '1px solid #c8e6c9'
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#388e3c' }}>
              {totals.finalAmount.toLocaleString('vi-VN')} VNĐ
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Tổng Thành Tiền</div>
          </div>
        </div>
      )}

      {/* Bảng lịch sử */}
      <div style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #e9ecef' }}>
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                         <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
               <tr>
                 <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>Ngày</th>
                 <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>Chi nhánh</th>
                 <th style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Point In</th>
                 <th style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Point Out</th>
                 <th style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Balance</th>
                 <th style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Daily Point</th>
                 <th style={{ padding: 12, textAlign: 'center', fontWeight: 'bold' }}>Rate</th>
                 <th style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Thành tiền (VNĐ)</th>
               </tr>
             </thead>
            <tbody>
              {history.map((h, index) => (
                <tr key={h.id} style={{ 
                  borderBottom: '1px solid #e9ecef',
                  '&:hover': { backgroundColor: '#f8f9fa' }
                }}>
                  <td style={{ padding: 12 }}>
                    {new Date(h.transaction_date).toLocaleDateString('vi-VN', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit' 
                    })}
                  </td>
                  <td style={{ padding: 12 }}>{selectedMachine?.branch?.name || 'N/A'}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                    {h.points_in?.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                    {h.points_out?.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#666' }}>Hôm qua: {h.previous_balance?.toLocaleString('vi-VN')}</div>
                    <div style={{ fontWeight: 'bold' }}>Hôm nay: {h.current_balance?.toLocaleString('vi-VN')}</div>
                  </td>
                                     <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                     {h.daily_point?.toLocaleString('vi-VN')}
                   </td>
                   <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
                     x{h.rate || 2}
                   </td>
                   <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                     {h.final_amount?.toLocaleString('vi-VN')}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {history.length === 0 && !loading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            Không có dữ liệu trong khoảng thời gian đã chọn
          </div>
        )}
      </div>
    </div>
  );
}

// Component chọn máy gấu bông để kiểm kê
function DailyAuditSelector({ token }) {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy danh sách máy gấu bông
  useEffect(() => {
    const fetchPrizeMachines = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_CONFIG.BASE_URL}/api/machines`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Chỉ lấy máy gấu bông
        const prizeMachines = (res.data || []).filter(m => m.type === 'prize_dispensing');
        setMachines(prizeMachines);
      } catch (error) {
        console.error("Lỗi lấy danh sách máy gấu bông", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          setError('Không thể lấy danh sách máy gấu bông');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPrizeMachines();
  }, [token]);

  const handleSelectMachine = (machine) => {
    navigate(`/audit/${machine.id}`);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 24, color: '#333' }}>📋 Chọn máy gấu bông để kiểm kê</h2>
      
      <div style={{ 
        padding: 16, 
        backgroundColor: '#fff3cd', 
        borderRadius: 8, 
        marginBottom: 24,
        border: '1px solid #ffeaa7'
      }}>
        <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: 8 }}>
          🧸 Hướng dẫn kiểm kê máy gấu bông:
        </div>
        <div style={{ color: '#856404', fontSize: 14 }}>
          • Chọn máy gấu bông cần kiểm kê từ danh sách dưới đây<br/>
          • Nhập số lượng quà hiện tại còn trong máy<br/>
          • Hệ thống sẽ tự động tính toán số quà đã phát ra
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}
      {error && <div style={{ color: 'red', padding: '10px 0', textAlign: 'center' }}>{error}</div>}

      {machines.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>🤔</div>
          <div style={{ color: '#666', marginBottom: 16 }}>
            Chưa có máy gấu bông nào trong hệ thống
          </div>
          <div style={{ fontSize: 14, color: '#999' }}>
            Vui lòng thêm máy gấu bông ở tab "🎮 Quản lý máy"
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {machines.map(machine => (
          <div
            key={machine.id}
            onClick={() => handleSelectMachine(machine)}
            style={{
              border: '2px solid #e3f2fd',
              borderRadius: 12,
              padding: 20,
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#2196F3';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e3f2fd';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 24, marginRight: 12 }}>🧸</span>
              <div>
                <h3 style={{ margin: 0, color: '#1976d2', fontSize: 18 }}>
                  {machine.name}
                </h3>
                <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                  {machine.machine_code} • {machine.branch?.name}
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: '#333' }}>
                <strong>Sản phẩm:</strong> {machine.product_name || `ID #${machine.product_id}`}
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: '#333' }}>
                <strong>Số lượng tiêu chuẩn:</strong> {machine.standard_quantity} quà
              </div>
            </div>
            
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 8,
              textAlign: 'center',
              marginTop: 16
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#28a745' }}>
                👆 Nhấn để kiểm kê
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MainPage() {
  const [activeTab, setActiveTab] = useState('data-entry');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#2196F3', 
        color: 'white', 
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Game Manager</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('data-entry')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'data-entry' ? '#2196F3' : 'transparent',
            color: activeTab === 'data-entry' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'data-entry' ? '3px solid #1976D2' : 'none'
          }}
        >
          📊 Nhập liệu
        </button>
        <button
          onClick={() => setActiveTab('history-entry')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'history-entry' ? '#2196F3' : 'transparent',
            color: activeTab === 'history-entry' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'history-entry' ? '3px solid #1976D2' : 'none'
          }}
        >
          📈 Lịch sử nhập
        </button>
        <button
          onClick={() => setActiveTab('machine-management')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'machine-management' ? '#2196F3' : 'transparent',
            color: activeTab === 'machine-management' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'machine-management' ? '3px solid #1976D2' : 'none'
          }}
        >
          🎮 Quản lý máy
        </button>
        <button
          onClick={() => setActiveTab('branch-management')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'branch-management' ? '#2196F3' : 'transparent',
            color: activeTab === 'branch-management' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'branch-management' ? '3px solid #1976D2' : 'none'
          }}
        >
          🏢 Quản lý chi nhánh
        </button>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'products' ? '#2196F3' : 'transparent',
            color: activeTab === 'products' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'products' ? '3px solid #1976D2' : 'none'
          }}
        >
          🧸 Quản lý sản phẩm
        </button>
        <button
          onClick={() => setActiveTab('warehouse')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'warehouse' ? '#2196F3' : 'transparent',
            color: activeTab === 'warehouse' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'warehouse' ? '3px solid #1976D2' : 'none'
          }}
        >
          📦 Quản lý kho
        </button>
        <button
          onClick={() => setActiveTab('daily-audit')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'daily-audit' ? '#2196F3' : 'transparent',
            color: activeTab === 'daily-audit' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'daily-audit' ? '3px solid #1976D2' : 'none'
          }}
        >
          📋 Kiểm kê hàng ngày
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: activeTab === 'reports' ? '#2196F3' : 'transparent',
            color: activeTab === 'reports' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 14,
            borderBottom: activeTab === 'reports' ? '3px solid #1976D2' : 'none'
          }}
        >
          📊 Báo cáo
        </button>
        <button
          onClick={() => navigate('/advance-payment')}
          style={{
            padding: '15px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#333',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          💰 Tạm ứng/Thanh toán
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'data-entry' && <DataEntry token={token} />}
        {activeTab === 'history-entry' && <HistoryEntry token={token} />}
        {activeTab === 'machine-management' && <MachineManagement token={token} />}
        {activeTab === 'branch-management' && <BranchManagement token={token} />}
        {activeTab === 'products' && <ProductManagementPage />}
        {activeTab === 'warehouse' && <WarehouseManagementPage />}
        {activeTab === 'daily-audit' && <DailyAuditSelector token={token} />}
        {activeTab === 'reports' && <ReportsPage />}
      </div>
    </div>
  );
}

export default MainPage; 