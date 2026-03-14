const express = require('express');
const {
    register,
    login,
    getVendors,
    getMe,
    markNotificationsRead,
    sendOTP,
    verifyOTP,
    verifyLoginOTP,
    resendLoginOTP,
    updateProfile,
    linkBank,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-login-otp', resendLoginOTP);
router.get('/me', protect, getMe);
router.put('/read-notifications', protect, markNotificationsRead);
router.get('/vendors', protect, getVendors);

// Verification Routes
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

// Profile Routes
router.put('/profile', protect, updateProfile);
router.put('/link-bank', protect, linkBank);

// Auth Action Routes
router.post('/reset-password', resetPassword);

module.exports = router;
