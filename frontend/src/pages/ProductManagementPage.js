import React, { useState, useEffect } from 'react';
import './ProductManagementPage.css';
import API_CONFIG from '../config/api';

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setError('');
      } else {
        setError('Không thể lấy danh sách sản phẩm');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      setError('Vui lòng nhập tên và giá sản phẩm');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingProduct ? `${API_CONFIG.BASE_URL}/api/products/${editingProduct.id}` : `${API_CONFIG.BASE_URL}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description
        })
      });

      if (response.ok) {
        fetchProducts();
        resetForm();
        setError('');
      } else {
        setError('Không thể lưu sản phẩm');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchProducts();
        setError('');
      } else {
        setError('Không thể xóa sản phẩm');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div className="product-management-page">
      <div className="page-header">
        <h1>Quản Lý Sản Phẩm (Quà)</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          Thêm Sản Phẩm Mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>{editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Sản Phẩm *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giá (VND) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô Tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm} disabled={loading}>
                  Hủy
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Đang lưu...' : (editingProduct ? 'Cập Nhật' : 'Thêm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-list">
        <h2>Danh Sách Sản Phẩm</h2>
        {loading && <div className="loading">Đang tải...</div>}
        
        {products.length === 0 && !loading ? (
          <div className="no-data">Chưa có sản phẩm nào</div>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Sản Phẩm</th>
                  <th>Giá</th>
                  <th>Mô Tả</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{new Intl.NumberFormat('vi-VN').format(product.price)} VND</td>
                    <td>{product.description || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-edit"
                        onClick={() => handleEdit(product)}
                        disabled={loading}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-delete"
                        onClick={() => handleDelete(product)}
                        disabled={loading}
                      >
                        Xóa
                      </button>
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

export default ProductManagementPage;
