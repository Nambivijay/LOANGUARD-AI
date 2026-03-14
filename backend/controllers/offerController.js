const Offer = require('../models/Offer');

exports.getOffers = async (req, res) => {
    try {
        let offers = await Offer.find().sort({ amount: 1 });

        // If no offers exist, seed some initial ones
        if (offers.length === 0) {
            const seedOffers = [
                {
                    title: "Starter Loan",
                    amount: 50000,
                    interestRate: 10,
                    tenureMonths: 12,
                    description: "Perfect for quick needs with low interest.",
                    tag: "Quick Approval"
                },
                {
                    title: "Business Growth",
                    amount: 200000,
                    interestRate: 12,
                    tenureMonths: 24,
                    description: "Expand your business with flexible repayment.",
                    tag: "Best Seller"
                },
                {
                    title: "Premium Credit",
                    amount: 500000,
                    interestRate: 9,
                    tenureMonths: 36,
                    description: "Large amount for premium members with long tenure.",
                    tag: "Premium"
                }
            ];
            offers = await Offer.insertMany(seedOffers);
        }

        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
