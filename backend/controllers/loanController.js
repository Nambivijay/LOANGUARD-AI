const Loan = require('../models/Loan');
const Utilization = require('../models/Utilization');
const Payment = require('../models/Payment');
const fs = require('fs');
const path = require('path');
const User = require('../models/User'); // Ensure User model is available for population

exports.createLoan = async (req, res) => {
    try {
        const debugData = {
            timestamp: new Date().toISOString(),
            body: req.body,
            files: req.files ? Object.keys(req.files) : 'none',
            headers: req.headers['content-type']
        };
        console.log('--- Submission Debug Output ---');
        console.log(JSON.stringify(debugData, null, 2));

        const debugFilePath = path.join(__dirname, '..', 'submission_debug.json');
        fs.appendFileSync(debugFilePath, JSON.stringify(debugData, null, 2) + '\n---\n');

        const {
            amount,
            purpose,
            personalDetails,
            employmentDetails,
            bankDetails,
            tenureMonths,
            interestRate
        } = req.body;

        const errors = [];
        if (!amount) errors.push('amount is required');
        if (!purpose) errors.push('purpose is required');

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation failed: ' + errors.join(', '),
                debug: debugData
            });
        }

        const loanAmount = Number(amount);
        const annualRate = Number(interestRate) || 12;
        const monthlyRate = annualRate / 12 / 100;
        const months = Number(tenureMonths) || 12;
        const emiValue = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

        const loan = await Loan.create({
            user: req.user.id,
            amount: loanAmount,
            purpose,
            personalDetails: typeof personalDetails === 'string' ? JSON.parse(personalDetails) : personalDetails,
            employmentDetails: typeof employmentDetails === 'string' ? JSON.parse(employmentDetails) : employmentDetails,
            bankDetails: typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails,
            tenureMonths: months,
            interestRate: annualRate,
            emi: Math.round(emiValue),
            documents: {
                idProof: req.files && req.files['idProof'] ? req.files['idProof'][0].path : null,
                bankStatement: req.files && req.files['bankStatement'] ? req.files['bankStatement'][0].path : null
            }
        });

        res.status(201).json(loan);
    } catch (error) {
        console.error('ERROR IN createLoan:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Validation failed: ' + validationErrors.join(', ')
            });
        }
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

exports.verifyFiles = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files uploaded for verification.' });
        }
        res.status(200).json({ message: 'Files successfully verified' });
    } catch (error) {
        console.error('ERROR IN verifyFiles:', error);
        res.status(500).json({ message: 'Internal Server Error during verification' });
    }
};

exports.getUserLoans = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const loans = await Loan.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $lookup: {
                    from: 'utilizations',
                    localField: '_id',
                    foreignField: 'loan',
                    as: 'utilizationRecords'
                }
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'loan',
                    as: 'paymentRecords'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'vendor',
                    foreignField: '_id',
                    as: 'vendorDetails'
                }
            },
            {
                $addFields: {
                    alreadyUtilized: { $sum: '$utilizationRecords.amount' },
                    totalPaid: { $sum: '$paymentRecords.amount' },
                    vendor: { $arrayElemAt: ['$vendorDetails', 0] }
                }
            },
            {
                $project: {
                    utilizationRecords: 0,
                    paymentRecords: 0,
                    vendorDetails: 0,
                    "vendor.password": 0
                }
            }
        ]);

        res.json(loans);
    } catch (error) {
        console.error('ERROR IN getUserLoans:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.payEMI = async (req, res) => {
    try {
        const { loanId, amount } = req.body;
        const payment = await Payment.create({
            loan: loanId,
            user: req.user.id,
            amount: Number(amount)
        });
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEMIPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ loan: req.params.loanId }).sort('-paidAt');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addUtilization = async (req, res) => {
    try {
        const { loanId, amount, category, description, vendorId } = req.body;

        // Check if loan exists and if user is authorized
        const loan = await Loan.findById(loanId);
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        const isBorrower = loan.user.toString() === req.user.id;
        const isVendor = loan.vendor && loan.vendor.toString() === req.user.id;

        if (!isBorrower && !isVendor) {
            return res.status(403).json({ message: 'Not authorized to add utilization for this loan' });
        }

        const utilization = await Utilization.create({
            loan: loanId,
            user: req.user.id,
            vendor: vendorId || (loan.vendor ? loan.vendor.toString() : null),
            amount: Number(amount),
            category,
            description,
            proofImage: req.file ? `/uploads/${req.file.filename}` : null
        });

        // Notify Selected Vendor if added by borrower
        const targetVendorId = vendorId || (loan.vendor ? loan.vendor.toString() : null);
        if (isBorrower && targetVendorId) {
            await User.findByIdAndUpdate(targetVendorId, {
                $push: {
                    notifications: {
                        message: `New bill uploaded for loan: ${loan.purpose} by ${req.user.name}. Please verify.`,
                        type: 'info'
                    }
                }
            });
        }

        res.status(201).json(utilization);
    } catch (error) {
        console.error('ERROR IN addUtilization:', error);
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

        // Notify Borrower
        await User.findByIdAndUpdate(loan.user, {
            $push: {
                notifications: {
                    message: `Your bill for ${utilization.category} (₹${utilization.amount}) has been completely verified.`,
                    type: 'success'
                }
            }
        });

        res.json(utilization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllLoansAdmin = async (req, res) => {
    try {
        const loans = await Loan.find().populate('user', 'name email').sort('-createdAt');
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLoanStatusAdmin = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const loan = await Loan.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user', 'name email');

        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignVendorAdmin = async (req, res) => {
    try {
        const { vendorId } = req.body;
        const loan = await Loan.findByIdAndUpdate(
            req.params.id,
            { vendor: vendorId },
            { new: true }
        ).populate('vendor', 'name email').populate('user', 'name email');

        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.confirmUtilization = async (req, res) => {
    try {
        const loan = await Loan.findOneAndUpdate(
            { _id: req.params.id, vendor: req.user.id },
            { $set: { utilizationConfirmed: true } },
            { new: true }
        );

        if (!loan) return res.status(404).json({ message: 'Loan not found or not assigned to you' });

        // Notify Borrower
        await User.findByIdAndUpdate(loan.user, {
            $push: {
                notifications: {
                    message: `Your loan utilization for "${loan.purpose}" has been fully confirmed by the vendor.`,
                    type: 'success'
                }
            }
        });

        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
