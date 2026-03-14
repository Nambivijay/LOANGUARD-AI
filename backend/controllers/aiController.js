const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        const msg = message.toLowerCase();
        const userId = req.user.id;

        // Fetch user data for context
        const loans = await Loan.find({ user: userId }).populate('vendor', 'name');

        let response = "";

        if (msg.includes('status')) {
            if (loans.length === 0) {
                response = "You don't have any loan applications yet. To get started, click 'Apply for New Loan' on your dashboard!";
            } else {
                const loanStatus = loans.map(l => `Loan for "${l.purpose}": ${l.status.toUpperCase()}`).join('\n');
                response = `Here is the status of your applications:\n${loanStatus}`;
            }
        } else if (msg.includes('apply') || msg.includes('application')) {
            response = "To apply for a loan, follow these simple steps:\n1. Go to your Dashboard.\n2. Click the 'Apply for New Loan' button in the top right.\n3. Fill in the details: Loan Amount, Purpose, Tenure (in months), and Interest Rate.\n4. Click 'Submit Application' to send it for admin review.";
        } else if (msg.includes('emi') || msg.includes('payment')) {
            if (loans.length === 0) {
                response = "You'll see EMI details here once you have an approved loan. Would you like to know how to apply?";
            } else {
                const approvedLoans = loans.filter(l => l.status === 'approved');
                if (approvedLoans.length === 0) {
                    response = "You don't have any approved loans yet. Once our team approves your application, your monthly EMI details will appear here.";
                } else {
                    const emiDetails = approvedLoans.map(l => `Loan for "${l.purpose}": EMI ₹${l.emi}/month for ${l.tenureMonths} months.`).join('\n');
                    response = `Your current EMI schedule is:\n${emiDetails}`;
                }
            }
        } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
            response = `Hello ${req.user.name}! I'm your LoanGuard assistant. I can help you with:\n- Checking your loan status\n- Explaining how to apply for a loan\n- EMI and payment details\n- Bill upload instructions\nWhat can I help you with first?`;
        } else if (msg.includes('bill') || msg.includes('upload') || msg.includes('usage')) {
            response = "Ready to upload a bill? Here's how:\n1. Find your approved loan on the Dashboard.\n2. Click 'Upload Bill'.\n3. Select the category and enter the amount.\n4. Upload a clear photo of your invoice/proof.\n5. Click 'Submit Bill' for vendor verification.";
        } else if (msg.includes('vendor')) {
            const vendors = loans.filter(l => l.vendor).map(l => `Vendor for "${l.purpose}": ${l.vendor.name} (${l.vendor.email})`);
            response = vendors.length > 0 ? `Your assigned vendors are:\n${vendors.join('\n')}` : "No vendors have been assigned to your loans yet. This usually happens once your loan is approved.";
        } else if (msg.includes('offer')) {
            response = "You can view available loan offers by clicking the 'View Loan Offers' button on your dashboard or the 'Offers' link in the navigation bar.";
        } else {
            response = "I'm here to help! You can ask me things like:\n- 'How do I apply for a loan?'\n- 'What is my loan status?'\n- 'Where do I upload bills?'\n- 'What are my EMI details?'";
        }

        res.json({ response });
    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ message: 'Error processing chat' });
    }
};
