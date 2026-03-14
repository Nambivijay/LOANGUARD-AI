const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['disbursement', 'emi_payment'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    referenceId: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
