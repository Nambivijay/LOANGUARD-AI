const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true }, // Annual rate
    tenureMonths: { type: Number, required: true },
    description: { type: String, required: true },
    tag: { type: String }, // e.g., "Recommended", "Best Value"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', offerSchema);
