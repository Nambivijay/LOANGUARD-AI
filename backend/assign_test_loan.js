const mongoose = require('mongoose');
const User = require('./models/User');
const Loan = require('./models/Loan');
require('dotenv').config({ path: './.env' });

async function assignLoan() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const vendor = await User.findOne({ role: 'vendor' });
        if (!vendor) {
            console.log('No vendor found. Please register a vendor first.');
            return;
        }

        const loan = await Loan.findOne().sort({ createdAt: -1 });
        if (!loan) {
            console.log('No loans found. Please request a loan first.');
            return;
        }

        loan.vendor = vendor._id;
        await loan.save();

        console.log(`Loan ${loan._id} assigned to vendor ${vendor.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

assignLoan();
