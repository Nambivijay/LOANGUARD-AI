const Loan = require('../models/Loan');
const Utilization = require('../models/Utilization');
const Payment = require('../models/Payment');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const NotificationService = require('../utils/notificationService');
const EligibilityService = require('../utils/eligibilityService');
const PayoutService = require('../utils/payoutService');

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
        const dueDay = Number(req.body.emiDueDay) || 1;
        const emiValue = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));
        
        // Generate EMI Schedule (Starting next month on dueDay)
        const emiSchedule = [];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(dueDay);
        nextMonth.setHours(0, 0, 0, 0);

        for (let i = 0; i < months; i++) {
            const dueDate = new Date(nextMonth);
            dueDate.setMonth(nextMonth.getMonth() + i);
            emiSchedule.push({
                dueDate,
                amount: emiValue,
                status: 'pending'
            });
        }

        const loanData = {
            user: req.user.id,
            amount: loanAmount,
            purpose,
            personalDetails: typeof personalDetails === 'string' ? JSON.parse(personalDetails) : personalDetails,
            employmentDetails: typeof employmentDetails === 'string' ? JSON.parse(employmentDetails) : employmentDetails,
            bankDetails: typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails,
            tenureMonths: months,
            interestRate: annualRate,
            emi: emiValue,
            emiSchedule,
            emiDueDay: dueDay,
            documents: {
                idProof: req.files && req.files['idProof'] ? req.files['idProof'][0].path : null,
                bankStatement: req.files && req.files['bankStatement'] ? req.files['bankStatement'][0].path : null
            }
        };

        // Real-time Eligibility Check
        const { eligible, message } = EligibilityService.checkEligibility(loanData);
        let status = 'pending';
        let disbursementId = null;
        let disbursementStatus = 'pending';

        if (eligible) {
            status = 'approved';
        }

        const loan = await Loan.create({ ...loanData, status });

        // If auto-approved, trigger disbursement
        if (status === 'approved') {
            try {
                const payoutResult = await PayoutService.initiatePayout(loan);
                loan.disbursementStatus = 'completed';
                loan.disbursementId = payoutResult.payoutId;
                await loan.save();

                // Record Transaction
                await Transaction.create({
                    user: req.user.id,
                    loan: loan._id,
                    amount: loan.amount,
                    type: 'disbursement',
                    status: 'completed',
                    referenceId: payoutResult.payoutId,
                    description: `Automated disbursement for ${loan.purpose}`
                });

                // Notify Instant Approval & Disbursement
                await NotificationService.notify(req.user.id, {
                    title: 'Loan Auto-Approved & Disbursed',
                    message: `Congratulations! ${message} Your loan amount of ₹${loan.amount} has been credited to your bank account.`,
                    type: 'success',
                    channels: ['in-app', 'sms', 'email']
                });
            } catch (payoutError) {
                console.error('Auto-payout failed:', payoutError);
                loan.disbursementStatus = 'failed';
                loan.disbursementError = payoutError.message;
                await loan.save();
            }
        } else {
            // Notify Eligibility Result if not auto-approved
            await NotificationService.notify(req.user.id, {
                title: 'Loan Application Received',
                message: eligible === false ? `Your application is under review. Note: ${message}` : 'Your application has been received and is under review.',
                type: 'info',
                channels: ['in-app']
            });
        }

        res.status(201).json({ loan, eligible, eligibilityMessage: message });
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

exports.updatePaymentMethod = async (req, res) => {
    try {
        const { loanId, paymentMethod } = req.body;
        const loan = await Loan.findOneAndUpdate(
            { _id: loanId, user: req.user.id },
            { preferredPaymentMethod: paymentMethod },
            { new: true }
        );
        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getNoDueCertificate = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate('user', 'name email');
        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        
        // Ownership or Admin Check
        const isOwner = loan.user?._id?.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to download this document' });
        }

        const isProgressReceipt = !loan.isClosed;
        const mainTitle = isProgressReceipt ? 'EMI PAYMENT RECEIPT' : 'NO DUE CERTIFICATE';

        const certificateContent = `
=========================================
        LOANGUARD-AI ${mainTitle}
=========================================

This is to certify that the loan application for "${loan.purpose}" 
with Loan ID: ${loan._id} ${isProgressReceipt ? 'is being actively repaid' : 'has been fully repaid'}.

BORROWER DETAILS:
Name: ${loan.user.name}
Email: ${loan.user.email}

LOAN DETAILS:
Amount: ₹${loan.amount}
Tenure: ${loan.tenureMonths} Months
Interest Rate: ${loan.interestRate}%

${isProgressReceipt ? `Latest Payment on: ${new Date().toLocaleDateString()}` : `Repayment completed on: ${new Date(loan.closureDate).toLocaleDateString()}`}

The borrower ${isProgressReceipt ? 'is current on their EMIs' : 'has no further dues towards this loan'}.

Issued by: LOANGUARD-AI System
Date: ${new Date().toLocaleDateString()}
=========================================
        `;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=${isProgressReceipt ? 'EMI_Receipt' : 'NoDueCertificate'}_${loan._id}.txt`);
        res.send(certificateContent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.payEMI = async (req, res) => {
    try {
        const { loanId, amount } = req.body;
        const loan = await Loan.findById(loanId);
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        // Update next pending EMI in schedule
        const nextEMI = loan.emiSchedule.find(e => e.status === 'pending');
        if (nextEMI) {
            nextEMI.status = 'paid';
            nextEMI.paidAt = new Date();
        }

        // Check if all EMIs are paid (ensure schedule exists)
        const allPaid = loan.emiSchedule.length > 0 && loan.emiSchedule.every(e => e.status === 'paid');
        if (allPaid) {
            loan.isClosed = true;
            loan.closureDate = new Date();
        }

        await loan.save();

        const payment = await Payment.create({
            loan: loanId,
            user: req.user.id,
            amount: Number(amount),
            paymentMethod: req.body.paymentMethod || loan.preferredPaymentMethod || 'Online'
        });

        // Record Transaction
        await Transaction.create({
            user: req.user.id,
            loan: loanId,
            amount: Number(amount),
            type: 'emi_payment',
            status: 'completed',
            description: `EMI Payment for ${loan.purpose}`
        });

        res.status(201).json({ payment, loan });

        // EMI Payment Received Alert (Borrower)
        await NotificationService.notify(req.user.id, {
            title: allPaid ? 'Loan Fully Closed' : 'EMI Payment Successful',
            message: allPaid 
                ? `Congratulations! Your loan for "${loan.purpose}" is fully paid and closed. A No Due Certificate has been generated.`
                : `Your EMI payment of ₹${amount} for loan ID ${loanId} has been received.`,
            type: 'success',
            channels: ['in-app', 'sms', 'email']
        });
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
        const { loanId, amount, category, description, vendorId, billNumber, billDate } = req.body;

        // Check if loan exists and if user is authorized
        const loan = await Loan.findById(loanId);
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        const isBorrower = loan.user.toString() === req.user.id;
        const isVendor = loan.vendor && loan.vendor.toString() === req.user.id;

        if (!isBorrower && !isVendor) {
            return res.status(403).json({ message: 'Not authorized to add utilization for this loan' });
        }

        // --- VALIDATIONS ---
        const bDate = new Date(billDate);
        const lDate = new Date(loan.createdAt);
        
        // 1. Bill Date Validation (Must not be before loan date)
        if (bDate < lDate) {
            return res.status(400).json({ 
                message: `Invalid Bill Date: The bill date cannot be earlier than the loan issuance date (${lDate.toLocaleDateString()}).` 
            });
        }

        // 2. Bill Upload Time Limit (90 days)
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
        if (new Date() - lDate > ninetyDaysInMs) {
            return res.status(400).json({ 
                message: 'Bill Upload Expired: Bills must be uploaded within 90 days of loan issuance.' 
            });
        }

        // 3. Duplicate Bill Detection (Bill Number + Amount for the same loan)
        const existingBill = await Utilization.findOne({
            loan: loanId,
            billNumber: billNumber,
            amount: Number(amount)
        });

        if (existingBill) {
            return res.status(400).json({ 
                message: `Duplicate Bill Detected: A bill with number ${billNumber} and amount ₹${amount} has already been uploaded for this loan.` 
            });
        }

        // 4. Duplicate Image Detection (Check if the same filename has been used before for this loan)
        if (req.file) {
            const existingImage = await Utilization.findOne({
                loan: loanId,
                proofImage: `/uploads/${req.file.filename}`
            });
            if (existingImage) {
                return res.status(400).json({ 
                    message: 'Duplicate File Detected: This document has already been uploaded for this loan.' 
                });
            }
        }

        const utilization = await Utilization.create({
            loan: loanId,
            user: req.user.id,
            vendor: vendorId || (loan.vendor ? loan.vendor.toString() : null),
            amount: Number(amount),
            billNumber,
            billDate: bDate,
            category,
            description,
            proofImage: req.file ? `/uploads/${req.file.filename}` : null
        });

        // Notify Selected Vendor if added by borrower
        const targetVendorId = vendorId || (loan.vendor ? loan.vendor.toString() : null);
        if (isBorrower && targetVendorId) {
            await NotificationService.notify(targetVendorId, {
                title: 'New Bill for Verification',
                message: `New bill uploaded for loan: ${loan.purpose} by ${req.user.name}. Please verify.`,
                type: 'info',
                channels: ['in-app', 'email']
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
        const isSelectedVendor = await Utilization.exists({ loan: req.params.loanId, vendor: req.user.id });

        if (!isBorrower && !isAssignedVendor && !isAdmin && !isSelectedVendor) {
            return res.status(403).json({ message: 'Not authorized to view these records' });
        }

        let query = { loan: req.params.loanId };
        if (!isBorrower && !isAdmin && !isAssignedVendor) {
            query.vendor = req.user.id;
        }

        const utilizations = await Utilization.find(query);
        res.json(utilizations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVendorLoans = async (req, res) => {
    try {
        const utilizations = await Utilization.find({ vendor: req.user.id }).select('loan');
        const loanIdsFromUtilizations = utilizations.map(u => u.loan);

        const loans = await Loan.find({
            $or: [
                { vendor: req.user.id },
                { _id: { $in: loanIdsFromUtilizations } }
            ]
        }).populate('user', 'name email');

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

        await NotificationService.notify(loan.user, {
            title: 'Loan Delivery Update',
            message: `Vendor has updated your loan status. Delivery: ${deliveryStatus || loan.deliveryStatus}. Payment: ${paymentConfirmed ? 'Confirmed' : 'Pending'}.`,
            type: 'info',
            channels: ['in-app', 'sms', 'email']
        });

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

        await NotificationService.notify(loan.user, {
            title: 'Bill Verified',
            message: `Your bill for ${utilization.category} (₹${utilization.amount}) has been completely verified.`,
            type: 'success',
            channels: ['in-app', 'sms', 'email']
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
        const { status, emiDueDay } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const loan = await Loan.findById(req.params.id).populate('user', 'name email');

        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        // If loan is being approved, initiate payout
        if (status === 'approved' && loan.status !== 'approved') {
            const PayoutService = require('../utils/payoutService');
            try {
                const payoutResult = await PayoutService.initiatePayout(loan);
                loan.disbursementStatus = 'completed';
                loan.disbursementId = payoutResult.payoutId;

                // Record Transaction
                await Transaction.create({
                    user: loan.user._id,
                    loan: loan._id,
                    amount: loan.amount,
                    type: 'disbursement',
                    status: 'completed',
                    referenceId: payoutResult.payoutId,
                    description: `Admin approved disbursement for ${loan.purpose}`
                });
            } catch (payoutError) {
                console.error('Payout failed during approval:', payoutError);
                loan.disbursementStatus = 'failed';
                loan.disbursementError = payoutError.message;
            }

            // (Re)Generate EMI Schedule based on emiDueDay if provided
            const dueDay = Number(emiDueDay) || loan.emiDueDay || 1;
            loan.emiDueDay = dueDay;
            
            const emiSchedule = [];
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(dueDay);
            nextMonth.setHours(0, 0, 0, 0);

            for (let i = 0; i < loan.tenureMonths; i++) {
                const dueDate = new Date(nextMonth);
                dueDate.setMonth(nextMonth.getMonth() + i);
                emiSchedule.push({
                    dueDate,
                    amount: loan.emi,
                    status: 'pending'
                });
            }
            loan.emiSchedule = emiSchedule;
        }

        loan.status = status;
        await loan.save();

        await NotificationService.notify(loan.user._id, {
            title: `Loan ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: status === 'approved' 
                ? `Your loan application for "${loan.purpose}" has been approved and disbursement has been initiated.`
                : `Your loan application for "${loan.purpose}" has been ${status} by the administrator.`,
            type: status === 'approved' ? 'success' : 'error',
            channels: ['in-app', 'email', 'sms']
        });

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

        await NotificationService.notify(loan.user, {
            title: 'Utilization Fully Confirmed',
            message: `Your loan utilization for "${loan.purpose}" has been fully confirmed by the vendor.`,
            type: 'success',
            channels: ['in-app', 'sms', 'email']
        });

        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort('-createdAt');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
