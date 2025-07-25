const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Machine, PointTransaction, Branch, AdvanceTransaction, TransactionEditLog } = require('./models');
const { Op } = require('sequelize');

// Import new route files
const productRoutes = require('./routes/products');
const machineRoutes = require('./routes/machines');
const auditRoutes = require('./routes/audits');
const warehouseRoutes = require('./routes/warehouse');

const app = express();

// Cấu hình CORS
app.use(cors());

// Middleware để parse JSON
app.use(express.json());

// Định nghĩa các route ở đây

const JWT_SECRET = process.env.JWT_SECRET || 'game_manager_secret';

// Middleware xác thực JWT
function authenticateToken(req, res, next) {
  console.log('Request headers:', req.headers);
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token:', token);
  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err);
      return res.sendStatus(401);
    }
    console.log('Decoded user:', user);
    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  res.send('Game Manager API đang chạy!');
});

// Endpoint seed đã được sử dụng và có thể xóa để bảo mật

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
  }
  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu.' });
  }
  // So sánh password (không hash)
  if (user.password !== password) {
    return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu.' });
  }
  // Tạo JWT
  const token = jwt.sign({ id: user.id, username: user.username, role_id: user.role_id, branch_id: user.branch_id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role_id: user.role_id, branch_id: user.branch_id } });
});

// Use the new routes with authentication
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/machines', authenticateToken, machineRoutes);
app.use('/api/audits', authenticateToken, auditRoutes);
app.use('/api/warehouse', authenticateToken, warehouseRoutes);


/**
 * API: Lấy dữ liệu nhập liệu của 1 máy theo ngày
 * GET /api/point?machine_id=...&date=YYYY-MM-DD
 * Trả về: dữ liệu nhập liệu nếu có
 */
app.get('/api/point', authenticateToken, async (req, res) => {
  try {
    const { machine_id, date } = req.query;
    if (!machine_id || !date) {
      return res.status(400).json({ message: 'Thiếu machine_id hoặc date' });
    }

    // Chuyển đổi ngày thành đầu ngày và cuối ngày theo múi giờ local
    const searchDate = new Date(date);
    const startOfDay = new Date(Date.UTC(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate()));
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // Tìm transaction theo máy và ngày
    const point = await PointTransaction.findOne({
      where: {
        machine_id,
        transaction_date: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay
        }
      }
    });
    res.json(point);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

/**
 * API: Lưu dữ liệu nhập liệu cho máy theo ngày
 * POST /api/point
 * Body: { machine_id, points_in, points_out, previous_balance, current_balance, daily_point, final_amount, transaction_date }
 * Nếu đã có dữ liệu ngày đó thì cập nhật, chưa có thì tạo mới
 */
app.post('/api/point', authenticateToken, async (req, res) => {
  try {
    const { 
      machine_id, 
      points_in, 
      points_out, 
      previous_balance,
      current_balance,
      daily_point,
      final_amount,
      transaction_date 
    } = req.body;
    
    if (!machine_id || !transaction_date) {
      return res.status(400).json({ message: 'Thiếu machine_id hoặc transaction_date' });
    }

    // Validation các giá trị nhập vào
    if (points_in < 0 || points_out < 0) {
      return res.status(400).json({ message: 'Point In và Point Out không được âm' });
    }

    // Lấy thông tin máy để kiểm tra rate
    const machine = await Machine.findByPk(machine_id);
    if (!machine) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin máy' });
    }

    // Lưu transaction mới (bao gồm rate hiện tại của máy)
    const transaction = await PointTransaction.create({
      machine_id,
      user_id: req.user.id,
      branch_id: req.user.branch_id,
      points_in: parseInt(points_in),
      points_out: parseInt(points_out),
      previous_balance: parseInt(previous_balance),
      current_balance: parseInt(current_balance),
      daily_point: parseInt(daily_point),
      final_amount: parseInt(final_amount),
      rate: machine.rate, // Lưu rate tại thời điểm tạo transaction
      transaction_date: new Date(transaction_date),
      created_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Trả về lịch sử mới nhất
    const history = await PointTransaction.findAll({
      attributes: ['id', 'machine_id', 'points_in', 'points_out', 'previous_balance', 'current_balance', 'daily_point', 'final_amount', 'rate', 'transaction_date'],
      where: { machine_id },
      order: [['transaction_date', 'DESC']],
      limit: 30
    });

    res.json(history);
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lưu dữ liệu' });
  }
});

/**
 * API: Lấy lịch sử nhập liệu của 1 máy
 * GET /api/history?machine_id=...&limit=30&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * Trả về: danh sách nhập liệu theo ngày, mới nhất trước
 */
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const { machine_id, limit = 30, from_date, to_date } = req.query;
    
    // Xây dựng where clause
    const whereClause = { machine_id };
    
    // Thêm filter theo range ngày nếu có
    if (from_date || to_date) {
      whereClause.transaction_date = {};
      
      if (from_date) {
        const fromDate = new Date(from_date);
        const startOfDay = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()));
        whereClause.transaction_date[Op.gte] = startOfDay;
      }
      
      if (to_date) {
        const toDate = new Date(to_date);
        const endOfDay = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1));
        whereClause.transaction_date[Op.lt] = endOfDay;
      }
    }
    
    const history = await PointTransaction.findAll({
      attributes: ['id', 'machine_id', 'points_in', 'points_out', 'previous_balance', 'current_balance', 'daily_point', 'final_amount', 'rate', 'transaction_date'],
      where: whereClause,
      order: [['transaction_date', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(history);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy lịch sử' });
  }
});

/**
 * API: Reset (xóa toàn bộ lịch sử nhập liệu) của 1 máy
 * DELETE /api/history?machine_id=...
 * Trả về: thông báo thành công
 */
app.delete('/api/history', authenticateToken, async (req, res) => {
  try {
    const { machine_id } = req.query;
    if (!machine_id) {
      return res.status(400).json({ message: 'Thiếu machine_id' });
    }
    // Xóa toàn bộ lịch sử nhập liệu của máy
    await PointTransaction.destroy({ where: { machine_id } });
    res.json({ message: 'Đã reset dữ liệu thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

/**
 * API: Cập nhật transaction (chỉ cho phép sửa Point In/Out, Balance, Final Amount)
 * PUT /api/transactions/:id
 * Body: { points_in, points_out, previous_balance, current_balance, final_amount }
 */
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { points_in, points_out, previous_balance, current_balance, final_amount } = req.body;
    
    // Validation
    if (points_in < 0 || points_out < 0) {
      return res.status(400).json({ message: 'Point In và Point Out không được âm' });
    }

    // Tìm transaction
    const transaction = await PointTransaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy transaction' });
    }

    // Kiểm tra quyền: chỉ được sửa transaction của máy thuộc chi nhánh mình (trừ admin)
    const machine = await Machine.findByPk(transaction.machine_id);
    if (!machine) {
      return res.status(404).json({ message: 'Không tìm thấy máy' });
    }

    if (req.user.role_id !== 1 && machine.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa transaction này' });
    }

    // Tính toán các thông số liên quan
    const parsedPointsIn = parseInt(points_in) || 0;
    const parsedPointsOut = parseInt(points_out) || 0;
    const parsedPreviousBalance = parseInt(previous_balance) || 0;
    const parsedCurrentBalance = parseInt(current_balance) || 0;
    
    // Tính toán daily_point từ current_balance và previous_balance
    const newDailyPoint = parsedCurrentBalance - parsedPreviousBalance;
    
    // Tính toán final_amount dựa trên daily_point và rate của máy
    const machineRate = transaction.rate || machine.rate || 2; // Sử dụng rate đã lưu trong transaction, fallback về rate hiện tại của máy
    const newFinalAmount = Math.round((newDailyPoint / machineRate) * 1000);

    // Lưu giá trị cũ trước khi update
    const oldValues = {
      points_in: transaction.points_in,
      points_out: transaction.points_out,
      previous_balance: transaction.previous_balance,
      current_balance: transaction.current_balance
    };

    // Cập nhật transaction
    await transaction.update({
      points_in: parsedPointsIn,
      points_out: parsedPointsOut,
      previous_balance: parsedPreviousBalance,
      current_balance: parsedCurrentBalance,
      daily_point: newDailyPoint,
      final_amount: newFinalAmount,
      updatedAt: new Date()
    });

    // Lưu log chỉnh sửa nếu có thay đổi
    const fields = [
      { key: 'points_in', old: oldValues.points_in, new: parsedPointsIn },
      { key: 'points_out', old: oldValues.points_out, new: parsedPointsOut },
      { key: 'previous_balance', old: oldValues.previous_balance, new: parsedPreviousBalance },
      { key: 'current_balance', old: oldValues.current_balance, new: parsedCurrentBalance }
    ];
    
    const now = new Date();
    console.log('=== DEBUG: Checking fields for log ===');
    for (const f of fields) {
      console.log(`Field: ${f.key}, Old: ${f.old}, New: ${f.new}, Changed: ${String(f.old) !== String(f.new)}`);
      if (String(f.old) !== String(f.new)) {
        console.log(`Creating log for field: ${f.key}`);
        await TransactionEditLog.create({
          transaction_id: transaction.id,
          editor_id: req.user.id,
          editor_name: req.user.full_name || req.user.username || '',
          field: f.key,
          old_value: String(f.old),
          new_value: String(f.new),
          edited_at: now
        });
        console.log(`Log created for field: ${f.key}`);
      }
    }
    console.log('=== END DEBUG ===');

    // Trả về transaction đã cập nhật
    const updatedTransaction = await PointTransaction.findByPk(id, {
      attributes: ['id', 'machine_id', 'points_in', 'points_out', 'previous_balance', 'current_balance', 'daily_point', 'final_amount', 'rate', 'transaction_date']
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Lỗi cập nhật transaction:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật transaction' });
  }
});

/**
 * API: Tạo máy mới
 * POST /api/machines
 * Body: { machine_code, name, rate, branch_id }
 */
app.post('/api/machines', authenticateToken, async (req, res) => {
  try {
    const { machine_code, name, rate, branch_id } = req.body;
    
    if (!machine_code || !name) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Xác định branch_id - admin có thể chọn, user thường dùng branch của mình
    let targetBranchId;
    if (req.user.role_id === 1 && branch_id) {
      // Admin có thể chọn chi nhánh
      targetBranchId = parseInt(branch_id);
    } else {
      // User thường chỉ có thể tạo máy cho chi nhánh của mình
      targetBranchId = req.user.branch_id;
    }

    // Kiểm tra machine_code đã tồn tại chưa trong cùng chi nhánh (chỉ trong những máy chưa bị xóa)
    const existingMachine = await Machine.findOne({ 
      where: { machine_code, branch_id: targetBranchId, is_deleted: false } 
    });
    if (existingMachine) {
      return res.status(400).json({ message: 'Mã máy đã tồn tại trong chi nhánh này' });
    }

    const machine = await Machine.create({
      machine_code,
      name,
      branch_id: targetBranchId,
      current_points: 0,
      rate: parseFloat(rate) || 2,
      created_at: new Date()
    });

    res.json(machine);
  } catch (error) {
    console.error('Lỗi tạo máy:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo máy' });
  }
});

/**
 * API: Cập nhật thông tin máy
 * PUT /api/machines/:id
 * Body: { machine_code, name, rate, branch_id }
 */
app.put('/api/machines/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { machine_code, name, rate, branch_id } = req.body;
    
    if (!machine_code || !name) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Admin có thể cập nhật máy ở bất kỳ chi nhánh nào, user chỉ được cập nhật máy của chi nhánh mình
    // Chỉ có thể cập nhật máy chưa bị xóa
    const whereClause = req.user.role_id === 1 
      ? { id, is_deleted: false } 
      : { id, branch_id: req.user.branch_id, is_deleted: false };
    const machine = await Machine.findOne({ where: whereClause });
    
    if (!machine) {
      return res.status(404).json({ message: 'Không tìm thấy máy hoặc bạn không có quyền chỉnh sửa máy này' });
    }

    // Xác định branch_id mới
    let targetBranchId;
    if (req.user.role_id === 1 && branch_id) {
      // Admin có thể di chuyển máy sang chi nhánh khác
      targetBranchId = parseInt(branch_id);
    } else {
      // User thường không thể chuyển máy sang chi nhánh khác
      targetBranchId = machine.branch_id;
    }

    // Kiểm tra machine_code đã tồn tại chưa trong chi nhánh đích (ngoại trừ máy hiện tại, chỉ trong những máy chưa bị xóa)
    const existingMachine = await Machine.findOne({ 
      where: { 
        machine_code, 
        branch_id: targetBranchId,
        id: { [Op.ne]: id },
        is_deleted: false
      } 
    });
    if (existingMachine) {
      return res.status(400).json({ message: 'Mã máy đã tồn tại trong chi nhánh này' });
    }

    await machine.update({
      machine_code,
      name,
      rate: parseFloat(rate) || 2,
      branch_id: targetBranchId
    });

    // Reload để có thông tin chi nhánh mới
    await machine.reload({
      include: [{
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'address', 'phone', 'manager_name']
      }]
    });

    res.json(machine);
  } catch (error) {
    console.error('Lỗi cập nhật máy:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật máy' });
  }
});

/**
 * API: Xóa mềm máy (đánh dấu is_deleted = true)
 * DELETE /api/machines/:id
 */
app.delete('/api/machines/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Admin có thể xóa máy ở bất kỳ chi nhánh nào, user chỉ được xóa máy của chi nhánh mình
    // Chỉ có thể xóa máy chưa bị xóa
    const whereClause = req.user.role_id === 1 
      ? { id, is_deleted: false } 
      : { id, branch_id: req.user.branch_id, is_deleted: false };
    
    const machine = await Machine.findOne({ where: whereClause });
    if (!machine) {
      return res.status(404).json({ message: 'Không tìm thấy máy hoặc bạn không có quyền xóa máy này' });
    }

    // Thực hiện soft delete - đánh dấu is_deleted = true
    await machine.update({ is_deleted: true });

    res.json({ message: 'Đã xóa máy thành công!' });
  } catch (error) {
    console.error('Lỗi xóa máy:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa máy' });
  }
});

/**
 * API: Lấy danh sách chi nhánh (chỉ admin mới có thể xem tất cả)
 * GET /api/branches
 */
app.get('/api/branches', authenticateToken, async (req, res) => {
  try {
    // Nếu là admin (role_id = 1) thì xem được tất cả chi nhánh
    // Nếu không thì chỉ xem được chi nhánh của mình
    // Chỉ lấy những chi nhánh chưa bị xóa (is_deleted = false)
    const whereClause = req.user.role_id === 1 
      ? { is_deleted: false } 
      : { id: req.user.branch_id, is_deleted: false };
    
    const branches = await Branch.findAll({ where: whereClause });
    res.json(branches);
  } catch (error) {
    console.error('Lỗi lấy danh sách chi nhánh:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách chi nhánh' });
  }
});

/**
 * API: Tạo chi nhánh mới (chỉ admin)
 * POST /api/branches
 * Body: { name, address, phone, manager_name }
 */
app.post('/api/branches', authenticateToken, async (req, res) => {
  try {
    // Chỉ admin mới có thể tạo chi nhánh
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Chỉ admin mới có thể tạo chi nhánh' });
    }

    const { name, address, phone, manager_name } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (tên và địa chỉ)' });
    }

    const branch = await Branch.create({
      name,
      address,
      phone: phone || '',
      manager_name: manager_name || '',
      created_at: new Date()
    });

    res.json(branch);
  } catch (error) {
    console.error('Lỗi tạo chi nhánh:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo chi nhánh' });
  }
});

/**
 * API: Cập nhật thông tin chi nhánh (chỉ admin)
 * PUT /api/branches/:id
 * Body: { name, address, phone, manager_name }
 */
app.put('/api/branches/:id', authenticateToken, async (req, res) => {
  try {
    // Chỉ admin mới có thể cập nhật chi nhánh
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Chỉ admin mới có thể cập nhật chi nhánh' });
    }

    const { id } = req.params;
    const { name, address, phone, manager_name } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (tên và địa chỉ)' });
    }

    const branch = await Branch.findOne({ where: { id, is_deleted: false } });
    if (!branch) {
      return res.status(404).json({ message: 'Không tìm thấy chi nhánh' });
    }

    await branch.update({
      name,
      address,
      phone: phone || '',
      manager_name: manager_name || ''
    });

    res.json(branch);
  } catch (error) {
    console.error('Lỗi cập nhật chi nhánh:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật chi nhánh' });
  }
});

/**
 * API: Xóa mềm chi nhánh (đánh dấu is_deleted = true)
 * DELETE /api/branches/:id
 */
app.delete('/api/branches/:id', authenticateToken, async (req, res) => {
  try {
    // Chỉ admin mới có thể xóa chi nhánh
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Chỉ admin mới có thể xóa chi nhánh' });
    }

    const { id } = req.params;
    
    const branch = await Branch.findOne({ where: { id, is_deleted: false } });
    if (!branch) {
      return res.status(404).json({ message: 'Không tìm thấy chi nhánh' });
    }

    // Kiểm tra xem có máy nào thuộc chi nhánh này không (chỉ kiểm tra máy chưa bị xóa)
    const machineCount = await Machine.count({ where: { branch_id: id, is_deleted: false } });
    if (machineCount > 0) {
      return res.status(400).json({ message: 'Không thể xóa chi nhánh có máy. Vui lòng xóa tất cả máy trước.' });
    }

    // Kiểm tra xem có user nào thuộc chi nhánh này không
    const userCount = await User.count({ where: { branch_id: id } });
    if (userCount > 0) {
      return res.status(400).json({ message: 'Không thể xóa chi nhánh có nhân viên. Vui lòng chuyển nhân viên sang chi nhánh khác trước.' });
    }

    // Thực hiện soft delete - đánh dấu is_deleted = true
    await branch.update({ is_deleted: true });
    res.json({ message: 'Đã xóa chi nhánh thành công!' });
  } catch (error) {
    console.error('Lỗi xóa chi nhánh:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa chi nhánh' });
  }
});

/**
 * API: Tạo tạm ứng mới
 * POST /api/advance-transactions
 * Body: { user_id, amount, description, transaction_date }
 */
app.post('/api/advance-transactions', authenticateToken, async (req, res) => {
  try {
    const { user_id, amount, description, transaction_date } = req.body;
    
    if (!user_id || !amount || !transaction_date) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }

    // Kiểm tra user có tồn tại và thuộc chi nhánh không
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // Kiểm tra quyền: admin có thể tạo tạm ứng cho bất kỳ ai, user thường chỉ có thể tạo cho người cùng chi nhánh
    if (req.user.role_id !== 1 && user.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Bạn không có quyền tạo tạm ứng cho nhân viên này' });
    }

    // Tạo transaction với sequelize transaction để đảm bảo tính toàn vẹn
    const t = await require('./models').sequelize.transaction();

    try {
      // Tạo advance transaction
      const advanceTransaction = await AdvanceTransaction.create({
        user_id: parseInt(user_id),
        branch_id: user.branch_id,
        transaction_type: 'ADVANCE',
        amount: parseInt(amount),
        description: description || '',
        transaction_date: new Date(transaction_date),
        remaining_amount: parseInt(amount),
        created_by: req.user.id
      }, { transaction: t });

      // Cập nhật số nợ của user: tạm ứng làm tăng nợ
      await user.update({
        debt_amount: user.debt_amount + parseInt(amount)
      }, { transaction: t });

      await t.commit();

      // Trả về kèm thông tin user và số nợ mới
      const result = await AdvanceTransaction.findByPk(advanceTransaction.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'debt_amount'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] }
        ]
      });

      res.json(result);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Lỗi tạo tạm ứng:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo tạm ứng' });
  }
});

/**
 * API: Thanh toán trực tiếp vào nợ tổng của user
 * POST /api/advance-transactions/direct-payment
 * Body: { user_id, amount, description, transaction_date }
 */
app.post('/api/advance-transactions/direct-payment', authenticateToken, async (req, res) => {
  try {
    const { user_id, amount, description, transaction_date } = req.body;
    
    if (!user_id || !amount || !transaction_date) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // Kiểm tra quyền: admin có thể thanh toán cho bất kỳ ai, user thường chỉ có thể thanh toán cho người cùng chi nhánh
    if (req.user.role_id !== 1 && user.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán cho nhân viên này' });
    }

    // Tạo transaction với sequelize transaction để đảm bảo tính toàn vẹn
    const t = await require('./models').sequelize.transaction();

    try {
      // Tạo thanh toán trực tiếp (không liên kết với advance transaction cụ thể)
      const paymentTransaction = await AdvanceTransaction.create({
        user_id: parseInt(user_id),
        branch_id: user.branch_id,
        transaction_type: 'PAYMENT',
        amount: parseInt(amount),
        description: description || '',
        transaction_date: new Date(transaction_date),
        advance_transaction_id: null, // Không liên kết với tạm ứng cụ thể
        created_by: req.user.id
      }, { transaction: t });

      // Cập nhật số nợ của user: thanh toán làm giảm nợ (có thể âm nếu trả thừa)
      await user.update({
        debt_amount: user.debt_amount - parseInt(amount)
      }, { transaction: t });

      await t.commit();

      // Trả về thông tin thanh toán và số nợ mới
      const result = await AdvanceTransaction.findByPk(paymentTransaction.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'debt_amount'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] }
        ]
      });

      res.json(result);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Lỗi tạo thanh toán trực tiếp:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo thanh toán' });
  }
});

/**
 * API: Tạo thanh toán cho tạm ứng (API cũ - vẫn giữ để tương thích)
 * POST /api/advance-transactions/:advance_id/payments
 * Body: { amount, description, transaction_date }
 */
app.post('/api/advance-transactions/:advance_id/payments', authenticateToken, async (req, res) => {
  try {
    const { advance_id } = req.params;
    const { amount, description, transaction_date } = req.body;
    
    if (!amount || !transaction_date) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }

    // Tìm tạm ứng gốc
    const advanceTransaction = await AdvanceTransaction.findOne({
      where: { id: advance_id, transaction_type: 'ADVANCE' },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'branch_id'] }]
    });

    if (!advanceTransaction) {
      return res.status(404).json({ message: 'Không tìm thấy tạm ứng' });
    }

    // Kiểm tra quyền: admin có thể thanh toán cho bất kỳ ai, user thường chỉ có thể thanh toán cho người cùng chi nhánh
    if (req.user.role_id !== 1 && advanceTransaction.user.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán cho tạm ứng này' });
    }

    // Ghi chú: Cho phép chi vượt quá tạm ứng (remaining_amount có thể âm)
    // Logic: remaining_amount âm = chủ phải bù thêm cho quản lý

    // Tạo transaction với sequelize transaction để đảm bảo tính toàn vẹn
    const t = await require('./models').sequelize.transaction();

    try {
      // Tạo thanh toán
      const paymentTransaction = await AdvanceTransaction.create({
        user_id: advanceTransaction.user_id,
        branch_id: advanceTransaction.branch_id,
        transaction_type: 'PAYMENT',
        amount: parseInt(amount),
        description: description || '',
        transaction_date: new Date(transaction_date),
        advance_transaction_id: parseInt(advance_id),
        created_by: req.user.id
      }, { transaction: t });

      // Cập nhật remaining_amount của tạm ứng gốc
      const newRemainingAmount = advanceTransaction.remaining_amount - parseInt(amount);
      await advanceTransaction.update({
        remaining_amount: newRemainingAmount
      }, { transaction: t });

      // Cập nhật số nợ của user: thanh toán làm giảm nợ
      const userToUpdate = await User.findByPk(advanceTransaction.user_id, { transaction: t });
      await userToUpdate.update({
        debt_amount: userToUpdate.debt_amount - parseInt(amount)
      }, { transaction: t });

      await t.commit();

      // Trả về kèm thông tin và số nợ mới
      const result = await AdvanceTransaction.findByPk(paymentTransaction.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'debt_amount'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
          { model: AdvanceTransaction, as: 'advance_transaction', attributes: ['id', 'amount', 'remaining_amount', 'transaction_date'] }
        ]
      });

      res.json(result);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Lỗi tạo thanh toán:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo thanh toán' });
  }
});

/**
 * API: Lấy danh sách tạm ứng/thanh toán
 * GET /api/advance-transactions?user_id=&branch_id=&type=&limit=50&offset=0
 */
app.get('/api/advance-transactions', authenticateToken, async (req, res) => {
  try {
    const { user_id, branch_id, type, limit = 50, offset = 0 } = req.query;
    
    let whereClause = {};
    
    // Xây dựng điều kiện where
    if (user_id) {
      whereClause.user_id = parseInt(user_id);
    }
    
    if (type && (type === 'ADVANCE' || type === 'PAYMENT')) {
      whereClause.transaction_type = type;
    }

    // Quyền truy cập: admin xem tất cả, user thường chỉ xem trong chi nhánh mình
    if (req.user.role_id !== 1) {
      whereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      whereClause.branch_id = parseInt(branch_id);
    }

    const transactions = await AdvanceTransaction.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
        { model: AdvanceTransaction, as: 'advance_transaction', attributes: ['id', 'amount', 'transaction_date'], required: false }
      ],
      order: [['transaction_date', 'DESC'], ['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(transactions);
  } catch (error) {
    console.error('Lỗi lấy danh sách tạm ứng:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách tạm ứng' });
  }
});

/**
 * API: Lấy tổng hợp công nợ của nhân viên
 * GET /api/advance-transactions/summary?user_id=&branch_id=
 */
app.get('/api/advance-transactions/summary', authenticateToken, async (req, res) => {
  try {
    const { user_id, branch_id } = req.query;
    
    let whereClause = {};
    
    if (user_id) {
      whereClause.id = parseInt(user_id);
    }

    // Quyền truy cập: admin xem tất cả, user thường chỉ xem trong chi nhánh mình
    if (req.user.role_id !== 1) {
      whereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      whereClause.branch_id = parseInt(branch_id);
    }

    // Lấy tất cả users với debt_amount khác 0
    const users = await User.findAll({
      where: {
        ...whereClause,
        debt_amount: { [Op.ne]: 0 } // Khác 0 (bao gồm âm và dương)
      },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name'] }
      ],
      attributes: ['id', 'username', 'full_name', 'debt_amount', 'branch_id'],
      order: [['full_name', 'ASC']]
    });

    // Chuyển đổi thành format cũ để tương thích với frontend
    const summary = users.reduce((acc, user) => {
      const key = `${user.id}-${user.username}`;
      acc[key] = {
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          debt_amount: user.debt_amount
        },
        branch: user.branch,
        total_balance: user.debt_amount, // Số nợ tổng của user
        advance_count: 0, // Không tính số lần tạm ứng nữa
        advances: [] // Có thể thêm lại nếu cần
      };
      return acc;
    }, {});

    res.json(Object.values(summary));
  } catch (error) {
    console.error('Lỗi lấy tổng hợp công nợ:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy tổng hợp công nợ' });
  }
});

/**
 * API: Lấy danh sách nhân viên (để chọn khi tạo tạm ứng)
 * GET /api/users
 */
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    
    // Quyền truy cập: admin xem tất cả, user thường chỉ xem trong chi nhánh mình
    if (req.user.role_id !== 1) {
      whereClause.branch_id = req.user.branch_id;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'username', 'full_name', 'branch_id'],
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
      order: [['full_name', 'ASC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách nhân viên' });
  }
});

/**
 * API: Reset (xóa toàn bộ) dữ liệu tạm ứng/thanh toán
 * DELETE /api/advance-transactions/reset
 * Chỉ admin mới có quyền reset
 */
app.delete('/api/advance-transactions/reset', authenticateToken, async (req, res) => {
  try {
    // Chỉ admin mới có quyền reset toàn bộ dữ liệu
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền reset dữ liệu' });
    }

    // Xóa toàn bộ advance transactions
    const deletedCount = await AdvanceTransaction.destroy({
      where: {},
      truncate: true // Xóa toàn bộ và reset auto increment
    });

    // Reset debt_amount của tất cả users về 0
    await User.update(
      { debt_amount: 0 },
      { where: {} }
    );

    res.json({ 
      message: 'Reset dữ liệu tạm ứng/thanh toán thành công! Đã reset số nợ của tất cả nhân viên về 0.',
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Lỗi reset dữ liệu tạm ứng:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi reset dữ liệu' });
  }
});

/**
 * API: Lấy lịch sử chỉnh sửa transaction
 * GET /api/transaction-edit-logs?transaction_id=...
 */
app.get('/api/transaction-edit-logs', authenticateToken, async (req, res) => {
  try {
    const { transaction_id } = req.query;
    if (!transaction_id) {
      return res.status(400).json({ message: 'Thiếu transaction_id' });
    }
    // Chỉ admin hoặc quản lý mới được xem
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Chỉ admin mới được xem lịch sử chỉnh sửa' });
    }
    const logs = await TransactionEditLog.findAll({
      where: { transaction_id },
      order: [['edited_at', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = app; 