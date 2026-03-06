const express = require('express');
const {
    createLoan,
    getUserLoans,
    addUtilization,
    getLoanUtilization,
    getVendorLoans,
    updateLoanVendorStatus,
    verifyUtilization,
    verifyFiles
} = require('../controllers/loanController');
const { protect, vendorOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/verify-files', protect, upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'salarySlip', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 }
]), verifyFiles);

router.post('/', protect, upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'salarySlip', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 }
]), createLoan);
router.get('/', protect, getUserLoans);
router.post('/utilization', protect, addUtilization);
router.get('/:loanId/utilization', protect, getLoanUtilization);

// Vendor Routes
router.get('/vendor/assigned', protect, vendorOnly, getVendorLoans);
router.put('/vendor/loan/:id', protect, vendorOnly, updateLoanVendorStatus);
router.put('/vendor/utilization/:id', protect, vendorOnly, verifyUtilization);

module.exports = router;
