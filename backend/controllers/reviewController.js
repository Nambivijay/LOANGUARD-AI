const Review = require('../models/Review');
const Loan = require('../models/Loan');

exports.createReview = async (req, res) => {
    try {
        const { vendorId, loanId, serviceQuality, deliverySpeed, verificationProcess, comment } = req.body;
        console.log('--- Review Submission Received ---');
        console.log('User:', req.user.id);
        console.log('Payload:', req.body);

        if (!vendorId || !loanId) {
            return res.status(400).json({ message: 'Missing vendor or loan ID. Please refresh the page.' });
        }

        // Verify if loan exists and borrower is authorized
        const loan = await Loan.findById(loanId);
        if (!loan) {
            console.log('Loan not found:', loanId);
            return res.status(404).json({ message: 'Loan record not found' });
        }

        if (loan.user.toString() !== req.user.id) {
            console.log('Auth check failed. Owner:', loan.user, 'Current:', req.user.id);
            return res.status(403).json({ message: 'Not authorized to review this vendor for this loan' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ borrower: req.user.id, loan: loanId });
        if (existingReview) {
            console.log('Existing review found');
            return res.status(400).json({ message: 'You have already reviewed this vendor for this loan' });
        }

        const review = await Review.create({
            borrower: req.user.id,
            vendor: vendorId,
            loan: loanId,
            serviceQuality,
            deliverySpeed,
            verificationProcess,
            comment
        });

        console.log('Review created successfully');
        res.status(201).json(review);
    } catch (error) {
        console.error('SERVER ERROR in createReview:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.getVendorStats = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const reviews = await Review.find({ vendor: vendorId });

        if (reviews.length === 0) {
            return res.json({
                averageRating: 0,
                serviceQuality: 0,
                deliverySpeed: 0,
                verificationProcess: 0,
                totalReviews: 0
            });
        }

        const stats = reviews.reduce((acc, rev) => {
            acc.serviceQuality += rev.serviceQuality;
            acc.deliverySpeed += rev.deliverySpeed;
            acc.verificationProcess += rev.verificationProcess;
            return acc;
        }, { serviceQuality: 0, deliverySpeed: 0, verificationProcess: 0 });

        const count = reviews.length;
        const avgSQ = stats.serviceQuality / count;
        const avgDS = stats.deliverySpeed / count;
        const avgVP = stats.verificationProcess / count;
        const overallAvg = (avgSQ + avgDS + avgVP) / 3;

        res.json({
            averageRating: overallAvg.toFixed(1),
            serviceQuality: avgSQ.toFixed(1),
            deliverySpeed: avgDS.toFixed(1),
            verificationProcess: avgVP.toFixed(1),
            totalReviews: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVendorReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ vendor: req.params.vendorId })
            .populate('borrower', 'name')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
