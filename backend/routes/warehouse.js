const express = require('express');
const router = express.Router();
const { WarehouseStock, Product, Machine, sequelize } = require('../models');

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

// POST /api/warehouse/refill-machine - Nhập gấu vào máy từ kho
router.post('/refill-machine', async (req, res) => {
  const { machine_id, product_id, quantity } = req.body;
  const user_id = req.user.id;

  if (!machine_id || !product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Thiếu thông tin máy, sản phẩm hoặc số lượng không hợp lệ.' });
  }

  const t = await sequelize.transaction();

  try {
    const machine = await Machine.findByPk(machine_id, { transaction: t });
    if (!machine || machine.type !== 'prize_dispensing') {
      await t.rollback();
      return res.status(404).json({ message: 'Máy không hợp lệ hoặc không phải máy gắp gấu.' });
    }

    // Kiểm tra kho có sản phẩm và đủ hàng không
    const stock = await WarehouseStock.findOne({ 
      where: { product_id: product_id }, 
      transaction: t 
    });
    
    if (!stock) {
      await t.rollback();
      return res.status(400).json({ 
        message: `Không tìm thấy sản phẩm ID ${product_id} trong kho.` 
      });
    }

    const stockQuantity = parseInt(stock.quantity);
    const requestQuantity = parseInt(quantity);

    if (stockQuantity < requestQuantity) {
      await t.rollback();
      return res.status(400).json({ 
        message: `Không đủ sản phẩm trong kho. Kho hiện có: ${stockQuantity}, yêu cầu: ${requestQuantity}` 
      });
    }

    // Kiểm tra máy có thể chứa thêm không
    const currentMachineCount = machine.current_quantity || 0;
    const newMachineCount = currentMachineCount + requestQuantity;

    if (newMachineCount > machine.standard_quantity) {
      await t.rollback();
      return res.status(400).json({ 
        message: `Máy chỉ có thể chứa tối đa ${machine.standard_quantity} quà. Hiện có: ${currentMachineCount}` 
      });
    }

    // Trừ kho và cộng vào máy
    await stock.decrement('quantity', { by: requestQuantity, transaction: t });
    await machine.update({ 
      current_quantity: newMachineCount,
      product_id: product_id // Cập nhật sản phẩm hiện tại của máy
    }, { transaction: t });

    await t.commit();
    
    res.json({ 
      message: `Đã nhập ${requestQuantity} sản phẩm vào máy ${machine.name}`,
      machine_current_quantity: newMachineCount,
      stock_remaining: stockQuantity - requestQuantity
    });

  } catch (error) {
    await t.rollback();
    console.error('Error refilling machine:', error);
    res.status(500).json({ message: 'Lỗi server khi nhập quà vào máy.', error: error.message });
  }
});

// POST /api/warehouse/reset - Reset tất cả warehouse stock về 0
router.post('/reset', async (req, res) => {
  const user_id = req.user.id;

  const t = await sequelize.transaction();

  try {
    // Reset tất cả warehouse stock về 0
    await WarehouseStock.update({ quantity: 0 }, { 
      where: {},
      transaction: t 
    });

    await t.commit();
    res.json({ message: 'Đã reset tất cả hàng tồn kho về 0' });

  } catch (error) {
    await t.rollback();
    console.error('Error resetting warehouse:', error);
    res.status(500).json({ message: 'Lỗi server khi reset kho.', error: error.message });
  }
});

module.exports = router; 