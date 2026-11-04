const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { logAudit } = require('../middleware/audit');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET || 'foodlab_super_secret_jwt_key_2026_enterprise',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanUsername }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your system administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);

    await logAudit({
      username: user.username,
      userRole: user.role,
      userId: user._id,
      action: 'LOGIN',
      entityType: 'Auth',
      entityId: user._id.toString(),
      description: `User '${user.fullName}' (${user.role}) logged in successfully.`,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin or initialization)
// @access  Public or Admin protected
const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, department } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
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
        message: 'User with this username or email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      fullName: fullName.trim(),
      role: role || 'Viewer',
      department: department || 'Laboratory Operations',
    });

    const token = signToken(newUser);

    await logAudit({
      username: req.user ? req.user.username : newUser.username,
      userRole: req.user ? req.user.role : newUser.role,
      userId: req.user ? req.user._id : newUser._id,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: newUser._id.toString(),
      description: `Created new user account: ${newUser.username} with role ${newUser.role}.`,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged in user details
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
};
