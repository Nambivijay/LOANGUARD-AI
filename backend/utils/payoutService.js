const axios = require('axios');
const Loan = require('../models/Loan');

/**
 * Payout Service to handle loan disbursement via RazorpayX
 * Note: In a real production environment, you would use the official Razorpay SDK
 * or direct API calls as implemented below.
 */

const RAZORPAYX_BASE_URL = 'https://api.razorpay.com/v1';

const getHeaders = () => {
    const keyId = process.env.RAZORPAYX_KEY_ID;
    const keySecret = process.env.RAZORPAYX_KEY_SECRET;
    
    if (!keyId || !keySecret) {
        return null; // Signals we should use mock mode
    }
    
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    return {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    };
};

/**
 * Initiates a payout for a given loan.
 * 1. Creates a Contact
 * 2. Creates a Fund Account
 * 3. Creates a Payout
 */
exports.initiatePayout = async (loan) => {
    const headers = getHeaders();
    
    if (!headers) {
        console.log('--- RAZORPAYX MOCK MODE ACTIVE ---');
        console.log(`Simulating payout for Loan ID: ${loan._id}, Amount: ${loan.amount}`);
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            status: 'completed',
            payoutId: `pout_mock_${Math.random().toString(36).substr(2, 9)}`,
            message: 'Simulated payout successful (No API keys provided)'
        };
    }

    try {
        // 1. Create Contact
        const contactResponse = await axios.post(`${RAZORPAYX_BASE_URL}/contacts`, {
            name: loan.personalDetails.fullName,
            email: loan.user.email || 'loan.user@example.com', // Fallback if email not populated
            contact: loan.personalDetails.phone,
            type: 'customer',
            reference_id: loan.user._id.toString()
        }, { headers });

        const contactId = contactResponse.data.id;

        // 2. Create Fund Account (Bank Account)
        const fundAccountResponse = await axios.post(`${RAZORPAYX_BASE_URL}/fund_accounts`, {
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
                name: loan.personalDetails.fullName,
                ifsc: loan.bankDetails.ifscCode,
                account_number: loan.bankDetails.accountNumber
            }
        }, { headers });

        const fundAccountId = fundAccountResponse.data.id;

        // 3. Create Payout
        const payoutResponse = await axios.post(`${RAZORPAYX_BASE_URL}/payouts`, {
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
            fund_account_id: fundAccountId,
            amount: loan.amount * 100, // Amount in paise
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: loan._id.toString(),
            notes: {
                loan_purpose: loan.purpose
            }
        }, { headers });

        return {
            status: 'completed',
            payoutId: payoutResponse.data.id,
            message: 'Payout initiated successfully via RazorpayX'
        };

    } catch (error) {
        console.error('RazorpayX Payout Error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.error?.description || 'Failed to initiate RazorpayX payout');
    }
};
