const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    personalDetails: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        dob: { type: Date, required: true }
    },
    employmentDetails: {
        occupation: { type: String, required: true },
        monthlyIncome: { type: Number, required: true },
        employerName: { type: String, required: true }
    },
    bankDetails: {
        accountNumber: { type: String, required: true },
        bankName: { type: String, required: true },
        ifscCode: { type: String, required: true }
    },
    documents: {
        idProof: { type: String },
        bankStatement: { type: String }
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    disbursedAmount: { type: Number, default: 0 },
    tenureMonths: { type: Number, default: 12 },
    interestRate: { type: Number, default: 12 }, // Annual rate
    emi: { type: Number },
    emiSchedule: [{
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        paidAt: { type: Date }
    }],
    preferredPaymentMethod: { type: String, enum: ['Bank Account', 'Card', 'UPI'] },
    isClosed: { type: Boolean, default: false },
    closureDate: { type: Date },
    paymentConfirmed: { type: Boolean, default: false },
    deliveryStatus: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
    isSuspicious: { type: Boolean, default: false },
    suspiciousReason: { type: String },
    utilizationConfirmed: { type: Boolean, default: false },
    disbursementStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    disbursementId: { type: String },
    disbursementError: { type: String },
    emiDueDay: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', loanSchema);
