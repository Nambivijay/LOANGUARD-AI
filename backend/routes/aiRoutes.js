const express = require('express');
const { handleChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('https://loanguard-ai-03c3.onrender.com/chat', protect, handleChat);

module.exports = router;
