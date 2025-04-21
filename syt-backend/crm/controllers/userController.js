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
    const { name, email, password, role, permissions, employeeId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user object including employeeId
    const userObject = {
      name,
      email,
      password,
      role: role || 'user',
      permissions: permissions || {
        canAddLead: role === 'admin' || role === 'manager',
        canRemoveLead: role === 'admin' || role === 'manager',
        canViewLeads: true,
        canAddUser: role === 'admin' || role === 'manager',
        canRemoveUser: role === 'admin' || role === 'manager',
        bookings: role === 'admin' || role === 'manager' // Adjust permissions as needed
      }
    };
    // Add employeeId only if provided
    if (employeeId) {
        userObject.employeeId = employeeId;
    }

    const user = await User.create(userObject);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        employeeId: user.employeeId // Include employeeId in response
      }
    });
  } catch (error) {
    // Add check for unique constraint violation on employeeId
    if (error.code === 11000 && error.keyPattern && error.keyPattern.employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }
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
    const { name, email, role, permissions, employeeId } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    // Update employeeId - allow setting to null/undefined or changing it
    if (employeeId !== undefined) user.employeeId = employeeId;

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        employeeId: user.employeeId // Include employeeId in response
      }
    });
  } catch (error) {
    // Add check for unique constraint violation on employeeId
    if (error.code === 11000 && error.keyPattern && error.keyPattern.employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }
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

// @desc    Get all agent users (for assignment dropdowns etc.)
// @route   GET /api/crm/users/agents
// @access  Private (Requires specific permission like 'canAddLead')
exports.getAgents = async (req, res) => {
  try {
    const { User } = getModels();

    // Find users with the role 'user' 
    const agents = await User.find({ role: 'user' })
      .select('name email _id employeeId') // Select employeeId
      .sort('name')
      .lean();

    res.status(200).json({
      success: true,
      count: agents.length,
      agents: agents // Keep the key as 'agents' for consistency with frontend
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};