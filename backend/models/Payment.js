const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    paymentMethod: { type: String, default: 'Online' }
});

module.exports = mongoose.model('Payment', paymentSchema);
