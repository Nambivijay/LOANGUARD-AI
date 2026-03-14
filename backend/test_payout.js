const mongoose = require('mongoose');
require('dotenv').config();
const payoutService = require('./utils/payoutService');

async function testPayout() {
    console.log('--- Starting Payout Service Test ---');
    
    // Mock Loan Object
    const mockLoan = {
        _id: new mongoose.Types.ObjectId(),
        amount: 50000,
        purpose: 'Education',
        user: { _id: new mongoose.Types.ObjectId(), email: 'nambijothiv@gmail.com' },
        personalDetails: {
            fullName: 'Vijay Kumar',
            phone: '9876543210'
        },
        bankDetails: {
            ifscCode: 'HDFC0001234',
            accountNumber: '1234567890'
        }
    };

    try {
        console.log('Initiating payout for mock loan...');
        const result = await payoutService.initiatePayout(mockLoan);
        console.log('SUCCESS:', result);
    } catch (error) {
        console.error('FAILURE:', error.message);
    }

    console.log('--- Test Finished ---');
    process.exit(0);
}

testPayout();
