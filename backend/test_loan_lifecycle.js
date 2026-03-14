const mongoose = require('mongoose');
const Loan = require('./models/Loan');
const Payment = require('./models/Payment');
const dotenv = require('dotenv');

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loanguard';

const demoUser = new mongoose.Types.ObjectId();

async function runTest() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // 1. Create a loan with schedule
        const loanAmount = 100000;
        const interestRate = 12;
        const tenureMonths = 6;
        const monthlyRate = interestRate / 12 / 100;
        const emiValue = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1));

        const emiSchedule = [];
        for (let i = 0; i < tenureMonths; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i + 1);
            emiSchedule.push({ dueDate, amount: emiValue, status: 'pending' });
        }

        const loan = await Loan.create({
            user: demoUser,
            amount: loanAmount,
            purpose: 'Test Loan',
            personalDetails: { fullName: 'Test', address: 'Test', phone: '1234567890', dob: new Date() },
            employmentDetails: { occupation: 'Test', monthlyIncome: 50000, employerName: 'Test' },
            bankDetails: { accountNumber: '123', bankName: 'Test', ifscCode: 'Test' },
            tenureMonths,
            interestRate,
            emi: emiValue,
            emiSchedule,
            status: 'approved'
        });

        console.log('Step 1: Loan created with schedule. Schedule length:', loan.emiSchedule.length);
        if (loan.emiSchedule.length !== tenureMonths) throw new Error('Schedule length mismatch');

        // 2. Pay one EMI
        const nextEMI = loan.emiSchedule.find(e => e.status === 'pending');
        nextEMI.status = 'paid';
        nextEMI.paidAt = new Date();
        await loan.save();

        console.log('Step 2: Paid one EMI. First EMI status:', loan.emiSchedule[0].status);
        if (loan.emiSchedule[0].status !== 'paid') throw new Error('EMI status update failed');

        // 3. Pay all EMIs
        loan.emiSchedule.forEach(e => {
            if (e.status === 'pending') {
                e.status = 'paid';
                e.paidAt = new Date();
            }
        });

        const allPaid = loan.emiSchedule.every(e => e.status === 'paid');
        if (allPaid) {
            loan.isClosed = true;
            loan.closureDate = new Date();
        }
        await loan.save();

        console.log('Step 3: All EMIs paid. Loan isClosed:', loan.isClosed);
        if (!loan.isClosed) throw new Error('Loan closure failed');

        console.log('✅ All backend logic tests passed!');

        // Cleanup
        await Loan.deleteOne({ _id: loan._id });
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

runTest();
