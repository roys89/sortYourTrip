const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Authentication routes
router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.post('/logout', authMiddleware, UserController.logout); // Ensure authMiddleware is used here
router.get('/status', authMiddleware, UserController.checkAuthStatus);

// Profile routes
router.get('/profile', authMiddleware, UserController.getUserProfile);
router.put('/profile', authMiddleware, UserController.updateUserProfile);

// Optional password reset routes (if needed)
router.post('/password-reset', UserController.passwordResetRequest);
router.put('/password-reset/:token', UserController.resetPassword);

router.get('/itineraries', authMiddleware, UserController.getUserItineraries);

module.exports = router;
