const express = require('express');
const { createReview, getVendorReviews, getVendorStats } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, createReview);
router.get('/:vendorId', getVendorReviews);
router.get('/:vendorId/stats', getVendorStats);

module.exports = router;
