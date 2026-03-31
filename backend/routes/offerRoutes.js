const express = require('express');
const { getOffers } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('https://loanguard-ai-03c3.onrender.com/', protect, getOffers);

module.exports = router;
