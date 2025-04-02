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

// Password reset / set password routes
router.post('/password-reset-request', UserController.passwordResetRequest); // Request reset for existing user
// router.put('/password-reset/:token', UserController.resetPassword); // Deprecated/Old? Maybe use POST for body

// --- New Route for Setting Password via Token --- 
// Used after agent registration or potentially password reset
router.post('/set-password', UserController.setNewPassword); // Does not require authMiddleware
// ---------------------------------------------

router.get('/itineraries', authMiddleware, UserController.getUserItineraries);

module.exports = router;
