const express = require('express');
const { handleChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/chat', protect, handleChat);

module.exports = router;
