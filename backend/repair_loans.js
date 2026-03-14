const mongoose = require('mongoose');
require('dotenv').config();

const fixLoans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loan-tracking');
        const Loan = require('./models/Loan');

        const loans = await Loan.find({ isClosed: true });
        console.log(`Found ${loans.length} closed loans to inspect.`);

        for (const loan of loans) {
            // If loan is closed but has no EMI schedule, it likely was closed prematurely
            if (!loan.emiSchedule || loan.emiSchedule.length === 0) {
                console.log(`Fixing Loan: ${loan._id} (${loan.purpose})`);
                
                // Generate schedule
                const loanAmount = Number(loan.amount);
                const annualRate = Number(loan.interestRate) || 12;
                const monthlyRate = annualRate / 12 / 100;
                const months = Number(loan.tenureMonths) || 12;
                const emiValue = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));
                
                const emiSchedule = [];
                const startDate = new Date(loan.createdAt || new Date());
                startDate.setMonth(startDate.getMonth() + 1);
                startDate.setDate(1);

                for (let i = 0; i < months; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);
                    emiSchedule.push({
                        dueDate,
                        amount: emiValue,
                        status: 'pending' // We might not know how many are paid, but let's reset or guess
                    });
                }

                loan.emiSchedule = emiSchedule;
                loan.isClosed = false;
                loan.closureDate = null;
                await loan.save();
                console.log(`Loan ${loan._id} reopened and schedule generated.`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixLoans();
