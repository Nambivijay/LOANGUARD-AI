const express = require('express');
const { getOffers } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getOffers);

module.exports = router;
