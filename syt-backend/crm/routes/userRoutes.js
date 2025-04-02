// crm/routes/userRoutes.js
const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// Import B2C search and registration functions from the B2C controller
const { searchB2CUsers, registerB2CCustomer } = require('../controllers/b2cUserController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

const router = express.Router();

// Apply authentication (protect) to all routes in this file first
router.use(protect);

// --- Routes handled by b2cUserController ---
router.get('/search-b2c', searchB2CUsers);
router.post('/register-customer', registerB2CCustomer); // Uses function from b2cUserController

// --- Admin-Only Routes for CRM Users (handled by userController) ---
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers) // Admin only
  .post([
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ], createUser); // Admin only

router
  .route('/:id')
  .get(getUser) // Admin only
  .put(updateUser) // Admin only
  .delete(deleteUser); // Admin only

module.exports = router;