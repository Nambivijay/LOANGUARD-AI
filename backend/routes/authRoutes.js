const express = require('express');
const { register, login, getVendors, getMe } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/vendors', protect, getVendors);

module.exports = router;
