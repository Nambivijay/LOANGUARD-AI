const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    serviceQuality: { type: Number, required: true, min: 1, max: 5 },
    deliverySpeed: { type: Number, required: true, min: 1, max: 5 },
    verificationProcess: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Ensure a borrower can only review a specific loan/vendor combination once
reviewSchema.index({ borrower: 1, loan: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
