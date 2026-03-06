const mongoose = require('mongoose');

const utilizationSchema = new mongoose.Schema({
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    proofImage: { type: String }, // Cloudinary URL
    status: { type: String, enum: ['pending', 'verified', 'flagged'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Utilization', utilizationSchema);
