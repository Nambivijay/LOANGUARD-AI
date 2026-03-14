/**
 * Eligibility Service to check if a user is eligible for a loan in real-time.
 */

exports.checkEligibility = (loanData) => {
    const { amount, tenureMonths, personalDetails, employmentDetails } = loanData;
    
    // 1. Basic Information check
    if (!personalDetails || !employmentDetails) {
        return { eligible: false, message: 'Incomplete personal or employment details.' };
    }

    // 2. Age Check (Assuming DOB is in personalDetails)
    if (personalDetails.dob) {
        const dob = new Date(personalDetails.dob);
        const age = new Date().getFullYear() - dob.getFullYear();
        if (age < 18) {
            return { eligible: false, message: 'Minimum age requirement not met (18+).' };
        }
    }

    // 3. Employment Check
    const monthlyIncome = Number(employmentDetails.monthlyIncome || 0);
    const minIncome = 15000; // Minimum income threshold
    
    if (monthlyIncome < minIncome) {
        return { eligible: false, message: `Monthly income ₹${monthlyIncome} is below the required minimum of ₹${minIncome}.` };
    }

    // 4. Debt-to-Income (DTI) Simplified Check
    // Max EMI should not exceed 50% of monthly income
    const annualRate = 12; // Standard assumed rate for eligibility
    const monthlyRate = annualRate / 12 / 100;
    const emi = Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1));
    
    if (emi > (monthlyIncome * 0.5)) {
        return { eligible: false, message: 'Requested loan amount leads to an EMI higher than 50% of your reported monthly income.' };
    }

    // 5. Approved!
    return { 
        eligible: true, 
        message: 'Congratulations! You meet our preliminary eligibility criteria. Your loan has been automatically approved.' 
    };
};
