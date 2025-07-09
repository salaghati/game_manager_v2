import React, { useState, useEffect } from 'react';
import './ReportsPage.css';
import API_CONFIG from '../config/api';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    machine_name: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/audits/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
        setError('');
      } else {
        setError('Không thể lấy dữ liệu báo cáo');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredReports = reports.filter(report => {
    const reportDate = new Date(report.audit_date);
    const fromDate = filters.from_date ? new Date(filters.from_date) : null;
    const toDate = filters.to_date ? new Date(filters.to_date) : null;
    const machineName = report.machine?.name?.toLowerCase() || '';
    const searchMachine = filters.machine_name.toLowerCase();

    // Date filtering
    if (fromDate && reportDate < fromDate) return false;
    if (toDate && reportDate > toDate) return false;
    
    // Machine name filtering
    if (searchMachine && !machineName.includes(searchMachine)) return false;

    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalGiftsWon = () => {
    return filteredReports.reduce((total, report) => total + report.gifts_won, 0);
  };

  const clearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
      machine_name: ''
    });
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Báo Cáo Kiểm Kê</h1>
        <button 
          className="btn btn-primary"
          onClick={fetchReports}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        <h2>Bộ Lọc</h2>
        <div className="filters-form">
          <div className="filter-group">
            <label>Từ ngày</label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Đến ngày</label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Tên máy</label>
            <input
              type="text"
              name="machine_name"
              value={filters.machine_name}
              onChange={handleFilterChange}
              placeholder="Tìm theo tên máy..."
            />
          </div>
          <div className="filter-actions">
            <button 
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div className="reports-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Tổng số báo cáo:</span>
            <span className="stat-value">{filteredReports.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tổng quà đã thắng:</span>
            <span className="stat-value">{getTotalGiftsWon()}</span>
          </div>
        </div>
      </div>

      <div className="reports-list">
        <h2>Lịch Sử Kiểm Kê</h2>
        {loading && <div className="loading">Đang tải...</div>}
        
        {filteredReports.length === 0 && !loading ? (
          <div className="no-data">
            {reports.length === 0 ? 
              'Chưa có báo cáo kiểm kê nào' : 
              'Không tìm thấy báo cáo phù hợp với bộ lọc'
            }
          </div>
        ) : (
          <div className="reports-table">
            <table>
              <thead>
                <tr>
                  <th>Ngày Kiểm Kê</th>
                  <th>Máy</th>
                  <th>Mã Máy</th>
                  <th>Người Kiểm Kê</th>
                  <th>Số Lượng Đầu Ngày</th>
                  <th>Số Lượng Cuối Ngày</th>
                  <th>Quà Đã Thắng</th>
                  <th>Đã Nạp Lại</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report.id}>
                    <td className="date-cell">
                      {formatDate(report.audit_date)}
                    </td>
                    <td className="machine-name">
                      {report.machine?.name || 'N/A'}
                    </td>
                    <td className="machine-code">
                      {report.machine?.machine_code || 'N/A'}
                    </td>
                    <td className="user-name">
                      {report.user?.full_name || report.user?.username || 'N/A'}
                    </td>
                    <td className="quantity start-count">
                      {report.start_of_day_count}
                    </td>
                    <td className="quantity end-count">
                      {report.end_of_day_count}
                    </td>
                    <td className="quantity gifts-won">
                      {report.gifts_won}
                    </td>
                    <td className="status">
                      <span className={`status-badge ${report.is_refilled ? 'refilled' : 'not-refilled'}`}>
                        {report.is_refilled ? 'Đã nạp' : 'Chưa nạp'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
