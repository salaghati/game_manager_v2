const express = require('express');
const router = express.Router();
const { WarehouseStock, Product } = require('../models');

// Middleware xác thực sẽ được áp dụng ở file app.js chính

// GET /api/warehouse - Get current stock of all products
router.get('/', async (req, res) => {
  try {
    const stocks = await WarehouseStock.findAll({
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'price'],
        where: { is_deleted: false }
      }],
      order: [[{ model: Product, as: 'product' }, 'name', 'ASC']]
    });
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching warehouse stock:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu kho.', error: error.message });
  }
});

// POST /api/warehouse/stock-in - Add quantity to a product's stock
router.post('/stock-in', async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm hoặc số lượng không hợp lệ.' });
  }

  try {
    const stock = await WarehouseStock.findOne({ where: { product_id } });
    if (!stock) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong kho.' });
    }

    await stock.increment('quantity', { by: quantity });

    res.json({ message: 'Nhập kho thành công.', stock });
  } catch (error) {
    console.error('Error stocking in:', error);
    res.status(500).json({ message: 'Lỗi server khi nhập kho.', error: error.message });
  }
});

module.exports = router; 