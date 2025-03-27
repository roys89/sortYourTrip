// crm/controllers/userController.js
const { getModels } = require('../models/Index'); // Import getModels instead of User directly
const { validationResult } = require('express-validator');

// @desc    Get all users
// @route   GET /api/crm/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { User } = getModels(); // Get User model instance
    
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single user
// @route   GET /api/crm/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const { User } = getModels();
    
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create user
// @route   POST /api/crm/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { User } = getModels();
    const { name, email, password, role, permissions } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      permissions: permissions || {
        canAddLead: role === 'admin',
        canRemoveLead: role === 'admin',
        canViewLeads: true,
        canAddUser: role === 'admin',
        canRemoveUser: role === 'admin'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user
// @route   PUT /api/crm/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { User } = getModels();
    const { name, email, role, permissions } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/crm/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { User } = getModels();
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};