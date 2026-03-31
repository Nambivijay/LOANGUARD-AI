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

router.post('https://loanguard-ai-03c3.onrender.com/register', register);
router.post('https://loanguard-ai-03c3.onrender.com/login', login);
router.post('https://loanguard-ai-03c3.onrender.com/verify-login-otp', verifyLoginOTP);
router.post('https://loanguard-ai-03c3.onrender.com/resend-login-otp', resendLoginOTP);
router.get('https://loanguard-ai-03c3.onrender.com/me', protect, getMe);
router.put('https://loanguard-ai-03c3.onrender.com/read-notifications', protect, markNotificationsRead);
router.get('https://loanguard-ai-03c3.onrender.com/vendors', protect, getVendors);

// Verification Routes
router.post('https://loanguard-ai-03c3.onrender.com/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

// Profile Routes
router.put('https://loanguard-ai-03c3.onrender.com/profile', protect, updateProfile);
router.put('https://loanguard-ai-03c3.onrender.com/link-bank', protect, linkBank);

// Auth Action Routes
router.post('https://loanguard-ai-03c3.onrender.com/reset-password', resetPassword);

module.exports = router;
