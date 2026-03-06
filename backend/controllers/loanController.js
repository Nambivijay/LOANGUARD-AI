const Loan = require('../models/Loan');
const Utilization = require('../models/Utilization');
const fs = require('fs');
const path = require('path');

exports.createLoan = async (req, res) => {
    try {
        // Log for debugging
        const debugData = {
            timestamp: new Date().toISOString(),
            body: req.body,
            files: req.files ? Object.keys(req.files) : 'none',
            headers: req.headers['content-type']
        };
        console.log('--- Submission Debug Output ---');
        console.log(JSON.stringify(debugData, null, 2));

        // Also write to a file in the backend root
        const debugFilePath = path.join(__dirname, '..', 'submission_debug.json');
        fs.appendFileSync(debugFilePath, JSON.stringify(debugData, null, 2) + '\n---\n');

        const {
            amount,
            purpose,
            personalDetails,
            employmentDetails,
            bankDetails
        } = req.body;

        // Manual validation before Mongoose
        const errors = [];
        if (!amount) errors.push('amount is required');
        if (!purpose) errors.push('purpose is required');

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation failed: ' + errors.join(', '),
                debug: debugData
            });
        }

        const documents = {};
        if (req.files) {
            if (req.files.idProof) documents.idProof = req.files.idProof[0].path;
            if (req.files.salarySlip) documents.salarySlip = req.files.salarySlip[0].path;
            if (req.files.bankStatement) documents.bankStatement = req.files.bankStatement[0].path;
        }

        const loan = await Loan.create({
            user: req.user.id,
            amount: Number(amount),
            purpose,
            personalDetails: typeof personalDetails === 'string' ? JSON.parse(personalDetails) : personalDetails,
            employmentDetails: typeof employmentDetails === 'string' ? JSON.parse(employmentDetails) : employmentDetails,
            bankDetails: typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails,
            documents
        });

        res.status(201).json(loan);
    } catch (error) {
        console.error('ERROR IN createLoan:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
            receivedBody: req.body
        });
    }
};

exports.verifyFiles = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files uploaded for verification.' });
        }

        const { idProof, salarySlip, bankStatement } = req.files;

        // Basic verification logic as per requirements
        // 1. ID Proof (Aadhaar) - should be an image
        // 2. Salary Slip - check if provided
        // 3. Bank Statement - should be a document/PDF or contain "bank" in name (simulated check)

        const verificationErrors = [];

        if (!idProof) {
            verificationErrors.push('ID Proof is missing.');
        } else {
            const file = idProof[0];
            if (!file.mimetype.startsWith('image/')) {
                verificationErrors.push('ID Proof (Aadhaar) must be an image.');
            }
        }

        if (!salarySlip) {
            verificationErrors.push('Salary Slip is missing.');
        }

        if (!bankStatement) {
            verificationErrors.push('Bank Statement is missing.');
        } else {
            const file = bankStatement[0];
            // Simulate checking content for "details or numbers"
            // Since we can't easily read file contents here without extra libs, we use a simulation
            const isValidStatement = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().includes('bank');
            if (!isValidStatement) {
                verificationErrors.push('Bank Statement must be a valid PDF or document containing bank details.');
            }
        }

        if (verificationErrors.length > 0) {
            return res.status(400).json({
                message: 'Files are not in the correct format. Please upload the correct files.',
                errors: verificationErrors
            });
        }

        res.status(200).json({ message: 'Files successfully verified' });
    } catch (error) {
        console.error('ERROR IN verifyFiles:', error);
        res.status(500).json({ message: 'Internal Server Error during verification' });
    }
};

exports.getUserLoans = async (req, res) => {
    try {
        const loans = await Loan.find({ user: req.user.id });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addUtilization = async (req, res) => {
    try {
        const { loanId, amount, category, description } = req.body;
        const utilization = await Utilization.create({
            loan: loanId,
            user: req.user.id,
            amount,
            category,
            description
        });
        res.status(201).json(utilization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLoanUtilization = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.loanId);
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        const isBorrower = loan.user.toString() === req.user.id;
        const isAssignedVendor = loan.vendor && loan.vendor.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isBorrower && !isAssignedVendor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view these records' });
        }

        const utilizations = await Utilization.find({ loan: req.params.loanId });
        res.json(utilizations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVendorLoans = async (req, res) => {
    try {
        const loans = await Loan.find({ vendor: req.user.id }).populate('user', 'name email');
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLoanVendorStatus = async (req, res) => {
    try {
        const { paymentConfirmed, deliveryStatus, isSuspicious, suspiciousReason } = req.body;
        const loan = await Loan.findOneAndUpdate(
            { _id: req.params.id, vendor: req.user.id },
            {
                $set: {
                    ...(paymentConfirmed !== undefined && { paymentConfirmed }),
                    ...(deliveryStatus && { deliveryStatus }),
                    ...(isSuspicious !== undefined && { isSuspicious }),
                    ...(suspiciousReason && { suspiciousReason })
                }
            },
            { new: true }
        );

        if (!loan) return res.status(404).json({ message: 'Loan not found or not assigned to you' });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyUtilization = async (req, res) => {
    try {
        const { status } = req.body;
        const utilization = await Utilization.findById(req.params.id);
        if (!utilization) return res.status(404).json({ message: 'Utilization record not found' });
        const loan = await Loan.findById(utilization.loan);
        if (loan.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to verify this record' });
        }
        utilization.status = status;
        await utilization.save();
        res.json(utilization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
