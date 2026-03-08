const express = require('express');
const {
    createLoan,
    getUserLoans,
    addUtilization,
    getLoanUtilization,
    getVendorLoans,
    updateLoanVendorStatus,
    verifyUtilization,
    verifyFiles,
    getAllLoansAdmin,
    updateLoanStatusAdmin,
    assignVendorAdmin,
    payEMI,
    getEMIPayments,
    confirmUtilization
} = require('../controllers/loanController');
const { protect, vendorOnly, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/verify-files', protect, upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 }
]), verifyFiles);

router.post('/', protect, upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 }
]), createLoan);
router.get('/', protect, getUserLoans);
router.post('/utilization', protect, upload.single('proofImage'), addUtilization);
router.get('/:loanId/utilization', protect, getLoanUtilization);
router.post('/emi-payment', protect, payEMI);
router.get('/:loanId/payments', protect, getEMIPayments);

// Vendor Routes
router.get('/vendor/assigned', protect, vendorOnly, getVendorLoans);
router.put('/vendor/loan/:id', protect, vendorOnly, updateLoanVendorStatus);
router.put('/vendor/utilization/:id', protect, vendorOnly, verifyUtilization);
router.put('/vendor/confirm-utilization/:id', protect, vendorOnly, confirmUtilization);

// Admin Routes
router.get('/admin/all', protect, adminOnly, getAllLoansAdmin);
router.put('/admin/status/:id', protect, adminOnly, updateLoanStatusAdmin);
router.put('/admin/assign-vendor/:id', protect, adminOnly, assignVendorAdmin);

module.exports = router;
