import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Percent, Clock, ChevronRight, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const LoanOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('/api/offers', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOffers(data);
            } catch (error) {
                console.error('Fetch offers error:', error);
                showToast('Failed to load loan offers', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    const handleSelectOffer = (offer) => {
        navigate('/apply-loan', {
            state: {
                amount: offer.amount,
                interestRate: offer.interestRate,
                tenureMonths: offer.tenureMonths
            }
        });
    };

    const calculateEMI = (amount, annualRate, months) => {
        const P = Number(amount);
        const R = annualRate / 12 / 100;
        const N = Number(months);
        const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
        return Math.round(emi);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="loan-offers-header">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '3rem' }}
            >
                <h1 className="gradient-text">Personalized Loan Offers</h1>
                <p className="subtitle">
                    Choose the best financial solution tailored for your needs with clear terms and immediate benefits.
                </p>
            </motion.div>

            <div className="offers-grid">
                {offers.map((offer, index) => (
                    <motion.div
                        key={offer._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                        className="card glass"
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '0',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {offer.tag && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '-35px',
                                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                color: 'white',
                                padding: '5px 40px',
                                transform: 'rotate(45deg)',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                zIndex: 1
                            }}>
                                {offer.tag.toUpperCase()}
                            </div>
                        )}

                        <div style={{ padding: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 800 }}>{offer.title}</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', height: '3rem', overflow: 'hidden' }}>{offer.description}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '5px' }}>Amount</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{offer.amount.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '5px' }}>Interest Rate</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{offer.interestRate}% <span style={{ fontSize: '0.7rem' }}>p.a</span></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                <Clock size={16} />
                                <span>Repayment Tenure: <strong>{offer.tenureMonths} Months</strong></span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                <span>Estimated EMI: <strong>₹{calculateEMI(offer.amount, offer.interestRate, offer.tenureMonths).toLocaleString()}/mo</strong></span>
                            </div>
                        </div>

                        <div style={{ padding: '2.5rem', paddingTop: '0' }}>
                            <button
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '1.2rem',
                                    borderRadius: '16px',
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                                onClick={() => handleSelectOffer(offer)}
                            >
                                Select this Offer <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style jsx>{`
                .loan-offers-header {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }
                .subtitle {
                    color: var(--text-muted);
                    font-size: 1.2rem;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .offers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 2.5rem;
                }
                @media (max-width: 768px) {
                    .loan-offers-header { padding: 1rem; }
                    h1 { font-size: 2.2rem !important; }
                    .subtitle { font-size: 1rem; }
                    .offers-grid { grid-template-columns: 1fr; gap: 1.5rem; }
                }
                .loader {
                    width: 48px;
                    height: 48px;
                    border: 5px solid #FFF;
                    border-bottom-color: var(--primary);
                    border-radius: 50%;
                    display: inline-block;
                    box-sizing: border-box;
                    animation: rotation 1s linear infinite;
                }
                @keyframes rotation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoanOffers;
