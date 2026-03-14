const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['borrower', 'vendor', 'admin'], default: 'borrower' },
    phone: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExp: { type: Date },
    notifications: [{
        message: { type: String, required: true },
        type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    borrowerDetails: {
        address: { type: String },
        businessName: { type: String },
        businessType: { type: String },
        annualIncome: { type: Number },
        utilizationPlan: { type: String },
        preferredVendor: { type: String }
    },
    isBankLinked: { type: Boolean, default: false },
    bankDetails: {
        accountNumber: { type: String },
        bankName: { type: String },
        ifscCode: { type: String },
        accountHolderName: { type: String }
    },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
