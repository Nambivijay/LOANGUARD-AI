const mongoose = require('mongoose');
require('dotenv').config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loan-tracking');
        const Loan = require('./models/Loan');
        const User = require('./models/User');

        const loans = await Loan.find({}).populate('user').populate('vendor');
        console.log('Total Loans:', loans.length);

        loans.forEach(loan => {
            console.log(`Loan ID: ${loan._id}`);
            console.log(`Purpose: ${loan.purpose}`);
            console.log(`Status: ${loan.status}`);
            console.log(`Is Closed: ${loan.isClosed}`);
            console.log(`EMI Schedule Count: ${loan.emiSchedule ? loan.emiSchedule.length : 'N/A'}`);
            console.log(`Borrower: ${loan.user ? loan.user.email : 'N/A'}`);
            console.log(`Vendor: ${loan.vendor ? loan.vendor.name : 'NOT ASSIGNED'}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
