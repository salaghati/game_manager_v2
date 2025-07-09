const express = require('express');
const router = express.Router();
const { Machine, Branch, PointTransaction, Product } = require('../models');
const { Op } = require('sequelize');

// Middleware xác thực sẽ được áp dụng ở file app.js chính

// GET all non-deleted machines (logic moved from app.js)
router.get('/', async (req, res) => {
  try {
    const whereClause = req.user.role_id === 1 
      ? { is_deleted: false } 
      : { branch_id: req.user.branch_id, is_deleted: false };
    
    const machines = await Machine.findAll({ 
      where: whereClause,
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          where: { is_deleted: false }
        }
      ],
      order: [['branch_id', 'ASC'], ['machine_code', 'ASC']]
    });

    const machinesWithDetails = await Promise.all(machines.map(async (machine) => {
      let details = { ...machine.toJSON() };
      
      if (machine.type === 'point_in_out' || !machine.type) { // Default behavior
        const latestTransaction = await PointTransaction.findOne({
          where: { machine_id: machine.id },
          order: [['transaction_date', 'DESC']],
          attributes: ['current_balance']
        });
        details.current_points = latestTransaction ? latestTransaction.current_balance : 0;
      }
      
      if (machine.type === 'prize_dispensing' && machine.product_id) {
         const product = await Product.findByPk(machine.product_id, { attributes: ['name'] });
         details.product_name = product ? product.name : 'N/A';
      }

      return details;
    }));

    res.json(machinesWithDetails);
  } catch (err) {
    console.error('Error fetching machines:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// POST /api/machines - Create a new machine
router.post('/', async (req, res) => {
  try {
    const { machine_code, name, rate, branch_id, type, standard_quantity, product_id } = req.body;
    
    // Basic validation
    if (!machine_code || !name || !rate || !branch_id) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: mã máy, tên máy, rate, chi nhánh.' });
    }

    // Additional validation for prize_dispensing machines
    if (type === 'prize_dispensing' && (!standard_quantity || !product_id)) {
      return res.status(400).json({ message: 'Máy gấu bông cần có số lượng tiêu chuẩn và sản phẩm.' });
    }

    // Check if machine_code already exists
    const existingMachine = await Machine.findOne({ 
      where: { machine_code, is_deleted: false } 
    });
    if (existingMachine) {
      return res.status(400).json({ message: 'Mã máy đã tồn tại.' });
    }

    // Check if branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch || branch.is_deleted) {
      return res.status(404).json({ message: 'Chi nhánh không tồn tại.' });
    }

    // Check if product exists for prize_dispensing machines
    if (type === 'prize_dispensing') {
      const product = await Product.findByPk(product_id);
      if (!product || product.is_deleted) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
      }
    }

    // Create machine
    const machine = await Machine.create({
      machine_code,
      name,
      rate: parseFloat(rate),
      branch_id: parseInt(branch_id),
      type: type || 'point_in_out', // Default to point_in_out
      standard_quantity: type === 'prize_dispensing' ? parseInt(standard_quantity) : null,
      product_id: type === 'prize_dispensing' ? parseInt(product_id) : null,
      current_points: 0,
      is_deleted: false
    });

    res.status(201).json({ message: 'Tạo máy thành công.', machine });
  } catch (error) {
    console.error('Error creating machine:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo máy.', error: error.message });
  }
});

// PUT /api/machines/:id - Update a machine
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { machine_code, name, rate, branch_id, type, standard_quantity, product_id } = req.body;
    
    // Find machine
    const machine = await Machine.findByPk(id);
    if (!machine || machine.is_deleted) {
      return res.status(404).json({ message: 'Không tìm thấy máy.' });
    }

    // Basic validation
    if (!machine_code || !name || !rate || !branch_id) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: mã máy, tên máy, rate, chi nhánh.' });
    }

    // Additional validation for prize_dispensing machines
    if (type === 'prize_dispensing' && (!standard_quantity || !product_id)) {
      return res.status(400).json({ message: 'Máy gấu bông cần có số lượng tiêu chuẩn và sản phẩm.' });
    }

    // Check if machine_code already exists (exclude current machine)
    const existingMachine = await Machine.findOne({ 
      where: { 
        machine_code, 
        is_deleted: false,
        id: { [Op.ne]: id }
      } 
    });
    if (existingMachine) {
      return res.status(400).json({ message: 'Mã máy đã tồn tại.' });
    }

    // Check if branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch || branch.is_deleted) {
      return res.status(404).json({ message: 'Chi nhánh không tồn tại.' });
    }

    // Check if product exists for prize_dispensing machines
    if (type === 'prize_dispensing') {
      const product = await Product.findByPk(product_id);
      if (!product || product.is_deleted) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
      }
    }

    // Update machine
    await machine.update({
      machine_code,
      name,
      rate: parseFloat(rate),
      branch_id: parseInt(branch_id),
      type: type || 'point_in_out',
      standard_quantity: type === 'prize_dispensing' ? parseInt(standard_quantity) : null,
      product_id: type === 'prize_dispensing' ? parseInt(product_id) : null
    });

    res.json({ message: 'Cập nhật máy thành công.', machine });
  } catch (error) {
    console.error('Error updating machine:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật máy.', error: error.message });
  }
});

// DELETE /api/machines/:id - Soft delete a machine
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const machine = await Machine.findByPk(id);
    if (!machine || machine.is_deleted) {
      return res.status(404).json({ message: 'Không tìm thấy máy.' });
    }

    // Soft delete
    await machine.update({ is_deleted: true });

    res.json({ message: 'Xóa máy thành công.' });
  } catch (error) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa máy.', error: error.message });
  }
});

// GET /api/machines/:id - Get a specific machine by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await Machine.findByPk(id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          where: { is_deleted: false }
        }
      ]
    });

    if (!machine || machine.is_deleted) {
      return res.status(404).json({ message: 'Không tìm thấy máy.' });
    }

    // Check permission for non-admin users
    if (req.user.role_id !== 1 && machine.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Không có quyền truy cập máy này.' });
    }

    let details = { ...machine.toJSON() };
    
    if (machine.type === 'point_in_out' || !machine.type) { // Default behavior
      const latestTransaction = await PointTransaction.findOne({
        where: { machine_id: machine.id },
        order: [['transaction_date', 'DESC']],
        attributes: ['current_balance']
      });
      details.current_points = latestTransaction ? latestTransaction.current_balance : 0;
    }
    
    if (machine.type === 'prize_dispensing' && machine.product_id) {
       const product = await Product.findByPk(machine.product_id);
       details.product = product ? { id: product.id, name: product.name, price: product.price } : null;
    }

    res.json(details);
  } catch (err) {
    console.error('Error fetching machine:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// PUT /api/machines/:id/config - Configure a machine's type and settings
router.put('/:id/config', async (req, res) => {
  const { type, standard_quantity, product_id } = req.body;
  const { id } = req.params;

  // Basic validation
  if (!type || (type === 'prize_dispensing' && (!standard_quantity || !product_id))) {
    return res.status(400).json({ message: 'Thiếu thông tin cấu hình máy.' });
  }

  try {
    const machine = await Machine.findByPk(id);
    if (!machine) {
      return res.status(404).json({ message: 'Không tìm thấy máy.' });
    }

    // Update the machine
    await machine.update({
      type,
      standard_quantity: type === 'prize_dispensing' ? standard_quantity : null,
      product_id: type === 'prize_dispensing' ? product_id : null,
    });

    res.json({ message: 'Cấu hình máy đã được cập nhật thành công.', machine });
  } catch (error) {
    console.error('Error configuring machine:', error);
    res.status(500).json({ message: 'Lỗi server khi cấu hình máy.', error: error.message });
  }
});


module.exports = router; 