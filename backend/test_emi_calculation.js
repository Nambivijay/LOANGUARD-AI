function calculateEMI(amount, annualRate, tenureMonths) {
    const loanAmount = Number(amount);
    const monthlyRate = annualRate / 12 / 100;
    const months = Number(tenureMonths);
    const emiValue = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emiValue);
}

const tests = [
    { amount: 100000, rate: 10, months: 12, expected: 8792 },
    { amount: 100000, rate: 12, months: 12, expected: 8885 },
    { amount: 200000, rate: 15, months: 24, expected: 9697 },
];

tests.forEach(test => {
    const result = calculateEMI(test.amount, test.rate, test.months);
    console.log(`Amount: ${test.amount}, Rate: ${test.rate}%, Months: ${test.months}`);
    console.log(`Expected: ${test.expected}, Got: ${result}`);
    if (result === test.expected) {
        console.log('✅ Pass');
    } else {
        console.log('❌ Fail');
    }
    console.log('---');
});
