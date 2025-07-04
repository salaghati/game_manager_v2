import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
      const res = await axios.get('http://localhost:3002/api/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách chi nhánh", error);
      setError('Không thể lấy danh sách chi nhánh');
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
        await axios.put(`http://localhost:3002/api/branches/${editingBranch.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật chi nhánh thành công!');
      } else {
        // Tạo chi nhánh mới
        await axios.post('http://localhost:3002/api/branches', formData, {
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
      await axios.delete(`http://localhost:3002/api/branches/${branch.id}`, {
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
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState({
    machine_code: '',
    name: '',
    rate: 2,
    branch_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy danh sách máy
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3002/api/machines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMachines(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách máy", error);
      setError('Không thể lấy danh sách máy');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Lấy danh sách chi nhánh
  const fetchBranches = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:3002/api/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách chi nhánh", error);
      // Nếu không lấy được chi nhánh, có thể user không phải admin
    }
  }, [token]);

  useEffect(() => {
    fetchMachines();
    fetchBranches();
  }, [token, fetchMachines, fetchBranches]);

  // Reset form
  const resetForm = () => {
    setFormData({ machine_code: '', name: '', rate: '', branch_id: '' });
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
        await axios.put(`http://localhost:3002/api/machines/${editingMachine.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật máy thành công!');
      } else {
        // Tạo máy mới
        await axios.post('http://localhost:3002/api/machines', formData, {
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
      branch_id: machine.branch_id
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
      await axios.delete(`http://localhost:3002/api/machines/${machine.id}`, {
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
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Chi nhánh</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Tỉ lệ cược</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Điểm hiện tại</th>
              <th style={{ border: '1px solid #ddd', padding: 12 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {machines.map(machine => (
              <tr key={machine.id}>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{machine.machine_code}</td>
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{machine.name}</td>
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
                <td style={{ border: '1px solid #ddd', padding: 12 }}>{machine.current_points}</td>
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
    current_balance: '',
    final_amount: ''
  });
  const [demoMode, setDemoMode] = useState(true); // True = cho phép sửa ngày đã nhập (demo), False = block ngày đã nhập

  // Lấy danh sách máy khi load
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:3002/api/machines', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMachines(res.data);
        if (res.data.length > 0) setSelectedMachineId(res.data[0].id);
      } catch (error) {
        console.error("Lỗi lấy danh sách máy", error);
        setError('Không thể lấy danh sách máy');
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
          axios.get('http://localhost:3002/api/history', {
            params: { machine_id: selectedMachineId, limit: 1 },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3002/api/point', {
            params: { machine_id: selectedMachineId, date: yesterdayStr },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3002/api/history', {
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
        
        setHistory(historyRes.data);
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
      const response = await axios.get('http://localhost:3002/api/point', {
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

      await axios.post('http://localhost:3002/api/point', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Hiển thị thông báo thành công
      alert('Lưu dữ liệu thành công!');
      
      // Tải lại dữ liệu
      const [historyRes, currentPoint] = await Promise.all([
        axios.get('http://localhost:3002/api/history', {
          params: { machine_id: selectedMachineId, limit: 30 },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3002/api/point', {
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
        await axios.delete('http://localhost:3002/api/history', {
          params: { machine_id: selectedMachineId },
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory([]);
        alert('Reset thành công!');
      } catch (error) {
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
      current_balance: transaction.current_balance,
      final_amount: transaction.final_amount
    });
  };

  // Hàm hủy edit
  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditForm({
      points_in: '',
      points_out: '',
      previous_balance: '',
      current_balance: '',
      final_amount: ''
    });
  };

  // Hàm lưu edit transaction
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      const response = await axios.put(`http://localhost:3002/api/transactions/${editingTransaction}`, editForm, {
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
  
  const selectedMachine = machines.find(m => m.id === parseInt(selectedMachineId));

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
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
          <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
            <h3>Nhập liệu điểm máy</h3>
            {selectedMachine && (
              <PointEntryForm
                machine={selectedMachine}
                date={selectedDate}
                token={token}
                onSave={handleSaveData}
                yesterdayBalance={yesterdayBalance}
                disabled={loading}
              />
            )}
          </div>
        </div>

        <div>
          {/* Cột phải: Lịch sử và reset */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Lịch sử nhập liệu</h3>
            <button onClick={handleReset} style={{backgroundColor: 'red', color: 'white', border: 'none', padding: 8, cursor: 'pointer'}}>Reset dữ liệu máy</button>
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
                  <th>Thành tiền (VNĐ)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, index) => (
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
                        <strong>{editForm.current_balance - editForm.previous_balance}</strong>
                      ) : (
                        h.daily_point
                      )}
                    </td>
                    <td>
                      {editingTransaction === h.id ? (
                        <input 
                          type="number" 
                          value={editForm.final_amount}
                          onChange={e => setEditForm({...editForm, final_amount: parseInt(e.target.value) || 0})}
                          style={{ width: '100px', padding: 2 }}
                          min="0"
                        />
                      ) : (
                        h.final_amount?.toLocaleString('vi-VN')
                      )}
                    </td>
                    <td>
                      {index === 0 ? ( // Chỉ hiển thị Edit cho dòng đầu tiên (mới nhất)
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
        display: 'flex'
      }}>
        <button
          onClick={() => setActiveTab('data-entry')}
          style={{
            padding: '15px 30px',
            border: 'none',
            backgroundColor: activeTab === 'data-entry' ? '#2196F3' : 'transparent',
            color: activeTab === 'data-entry' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 16,
            borderBottom: activeTab === 'data-entry' ? '3px solid #1976D2' : 'none'
          }}
        >
          📊 Nhập liệu
        </button>
        <button
          onClick={() => setActiveTab('machine-management')}
          style={{
            padding: '15px 30px',
            border: 'none',
            backgroundColor: activeTab === 'machine-management' ? '#2196F3' : 'transparent',
            color: activeTab === 'machine-management' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 16,
            borderBottom: activeTab === 'machine-management' ? '3px solid #1976D2' : 'none'
          }}
        >
          🎮 Quản lý máy
        </button>
        <button
          onClick={() => setActiveTab('branch-management')}
          style={{
            padding: '15px 30px',
            border: 'none',
            backgroundColor: activeTab === 'branch-management' ? '#2196F3' : 'transparent',
            color: activeTab === 'branch-management' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: 16,
            borderBottom: activeTab === 'branch-management' ? '3px solid #1976D2' : 'none'
          }}
        >
          🏢 Quản lý chi nhánh
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'data-entry' && <DataEntry token={token} />}
        {activeTab === 'machine-management' && <MachineManagement token={token} />}
        {activeTab === 'branch-management' && <BranchManagement token={token} />}
      </div>
    </div>
  );
}

export default MainPage; 