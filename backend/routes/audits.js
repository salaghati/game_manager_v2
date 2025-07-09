const express = require('express');
const router = express.Router();
const { DailyMachineAudit, Machine, WarehouseStock, sequelize } = require('../models');
const { Op } = require('sequelize');

// Middleware xác thực sẽ được áp dụng ở file app.js chính

// POST /api/audits - Submit a daily machine audit
router.post('/', async (req, res) => {
  const { machine_id, end_of_day_count } = req.body;
  const user_id = req.user.id;

  if (!machine_id || end_of_day_count === undefined || end_of_day_count < 0) {
    return res.status(400).json({ message: 'Thiếu thông tin hoặc dữ liệu không hợp lệ.' });
  }

  const t = await sequelize.transaction();

  try {
    const machine = await Machine.findByPk(machine_id, { transaction: t });
    if (!machine || machine.type !== 'prize_dispensing') {
      await t.rollback();
      return res.status(404).json({ message: 'Máy không hợp lệ hoặc không phải máy gắp gấu.' });
    }

    const start_of_day_count = machine.standard_quantity;
    const gifts_won = Math.max(0, start_of_day_count - end_of_day_count);

    // 1. Create the audit record
    const audit = await DailyMachineAudit.create({
      machine_id,
      user_id,
      audit_date: new Date(),
      start_of_day_count,
      end_of_day_count,
      gifts_won,
      is_refilled: true // Assume it's refilled upon audit
    }, { transaction: t });

    // 2. Update the warehouse stock
    const stock = await WarehouseStock.findOne({ where: { product_id: machine.product_id }, transaction: t });
    if (!stock || stock.quantity < gifts_won) {
      await t.rollback();
      return res.status(400).json({ message: 'Không đủ quà trong kho để bù.' });
    }

    await stock.decrement('quantity', { by: gifts_won, transaction: t });
    
    await t.commit();
    res.status(201).json({ message: 'Báo cáo kiểm kê đã được ghi nhận.', audit });

  } catch (error) {
    await t.rollback();
    console.error('Error creating audit:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo báo cáo kiểm kê.', error: error.message });
  }
});

// GET /api/audits/reports - Get audit history
router.get('/reports', async (req, res) => {
    // For admins to view reports. Can be enhanced with filters later.
    try {
        const reports = await DailyMachineAudit.findAll({
            include: [
                { model: Machine, as: 'machine', attributes: ['name', 'machine_code'] },
                { model: require('../models').User, as: 'user', attributes: ['username', 'full_name'] }
            ],
            order: [['audit_date', 'DESC']]
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy báo cáo.', error: error.message });
    }
});


module.exports = router; 