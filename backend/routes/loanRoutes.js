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
    getTransactions,
    confirmUtilization,
    updatePaymentMethod,
    getNoDueCertificate
} = require('../controllers/loanController');
const { protect, vendorOnly, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('https://loanguard-ai-03c3.onrender.com/verify-files', protect, upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 }
]), verifyFiles);

router.post('https://loanguard-ai-03c3.onrender.com/', protect, upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 }
]), createLoan);
router.get('https://loanguard-ai-03c3.onrender.com/', protect, getUserLoans);
router.post('https://loanguard-ai-03c3.onrender.com/utilization', protect, upload.single('proofImage'), addUtilization);
router.get('https://loanguard-ai-03c3.onrender.com/:loanId/utilization', protect, getLoanUtilization);
router.post('https://loanguard-ai-03c3.onrender.com/emi-payment', protect, payEMI);
router.get('https://loanguard-ai-03c3.onrender.com/:loanId/payments', protect, getEMIPayments);
router.get('https://loanguard-ai-03c3.onrender.com/transactions', protect, getTransactions);
router.put('https://loanguard-ai-03c3.onrender.com/payment-method', protect, updatePaymentMethod);
router.get('https://loanguard-ai-03c3.onrender.com/:id/certificate', protect, getNoDueCertificate);

// Vendor Routes
router.get('https://loanguard-ai-03c3.onrender.com/vendor/assigned', protect, vendorOnly, getVendorLoans);
router.put('https://loanguard-ai-03c3.onrender.com/vendor/loan/:id', protect, vendorOnly, updateLoanVendorStatus);
router.put('/vendor/utilization/:id', protect, vendorOnly, verifyUtilization);
router.put('/vendor/confirm-utilization/:id', protect, vendorOnly, confirmUtilization);

// Admin Routes
router.get('https://loanguard-ai-03c3.onrender.com/admin/all', protect, adminOnly, getAllLoansAdmin);
router.put('https://loanguard-ai-03c3.onrender.com/admin/status/:id', protect, adminOnly, updateLoanStatusAdmin);
router.put('https://loanguard-ai-03c3.onrender.com/admin/assign-vendor/:id', protect, adminOnly, assignVendorAdmin);

module.exports = router;
