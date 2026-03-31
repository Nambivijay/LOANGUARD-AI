const express = require('express');
const { createReview, getVendorReviews, getVendorStats } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('https://loanguard-ai-03c3.onrender.com/', protect, createReview);
router.get('https://loanguard-ai-03c3.onrender.com/:vendorId', getVendorReviews);
router.get('https://loanguard-ai-03c3.onrender.com/:vendorId/stats', getVendorStats);

module.exports = router;
