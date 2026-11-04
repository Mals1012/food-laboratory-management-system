const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { logAudit } = require('../middleware/audit');

// @route   GET /api/users
// @desc    Get all users with search and role filter
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status !== undefined && status !== 'All') {
      query.isActive = status === 'Active' || status === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users
// @desc    Admin creates a new user
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, department } = req.body;

    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, full name, and role are required.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this username or email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      fullName: fullName.trim(),
      role,
      department: department || 'Laboratory Operations',
      isActive: true,
    });

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `Admin created user '${user.username}' with role '${user.role}'.`,
      metadata: { role: user.role, email: user.email },
    });

    res.status(201).json({
      success: true,
      message: `User '${user.username}' created successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/:id
// @desc    Update user details, status, or role
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, department, isActive, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Protect master admin from role demotion or deactivation if it's the only admin
    if (user.username === 'admin' && (isActive === false || (role && role !== 'Admin'))) {
      return res.status(400).json({
        success: false,
        message: 'Master administrator account cannot be deactivated or demoted.',
      });
    }

    if (fullName) user.fullName = fullName.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role;
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `Admin updated user profile for '${user.username}'.`,
      metadata: { role: user.role, isActive: user.isActive },
    });

    res.status(200).json({
      success: true,
      message: `User '${user.username}' updated successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
};
