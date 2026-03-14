import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const RatingModal = ({ isOpen, onClose, vendorId, loanId, vendorName, onReviewSubmitted }) => {
    const [ratings, setRatings] = useState({
        serviceQuality: 0,
        deliverySpeed: 0,
        verificationProcess: 0
    });
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleRating = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Log target ids for debugging
        console.log('Target IDs:', { vendorId, loanId });

        if (!ratings.serviceQuality || !ratings.deliverySpeed || !ratings.verificationProcess) {
            showToast('Please provide all three ratings', 'warning');
            return;
        }

        if (!vendorId || !loanId) {
            showToast('Unable to identify vendor or loan. Please try refreshing the dashboard.', 'error');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/reviews', {
                vendorId,
                loanId,
                ...ratings,
                comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast('Review submitted successfully!', 'success');
            onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error('Submission error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error submitting review';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ category }) => (
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    size={24}
                    fill={star <= ratings[category] ? '#fbbf24' : 'none'}
                    color={star <= ratings[category] ? '#fbbf24' : '#475569'}
                    strokeWidth={star <= ratings[category] ? 0 : 2}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => handleRating(category, star)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            ))}
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content glass" style={{ maxWidth: '450px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Rate Vendor: {vendorName}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Service Quality</label>
                        <StarRating category="serviceQuality" />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Delivery Speed</label>
                        <StarRating category="deliverySpeed" />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Verification Process</label>
                        <StarRating category="verificationProcess" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Comment (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about your experience..."
                            style={{
                                height: '100px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                padding: '12px',
                                color: 'white',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
