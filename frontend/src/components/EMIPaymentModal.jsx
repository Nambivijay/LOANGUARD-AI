import React, { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle, CreditCard, ChevronRight, AlertCircle, TrendingUp, Smartphone, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMIPaymentModal = ({ isOpen, onClose, loanId, emiAmount, loanPurpose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: Confirmation, 2: Payment Method
    const [paymentMethod, setPaymentMethod] = useState('');

    const paymentMethods = [
        { id: 'Auto Debit', name: 'Auto Debit (ECS/NACH)', icon: <TrendingUp size={18} /> },
        { id: 'UPI', name: 'UPI (GPay/PhonePe)', icon: <Smartphone size={18} /> },
        { id: 'Net Banking', name: 'Net Banking', icon: <Landmark size={18} /> },
        { id: 'Debit Card', name: 'Debit Card', icon: <CreditCard size={18} /> },
        { id: 'Credit Card', name: 'Credit Card', icon: <CreditCard size={18} /> }
    ];

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!paymentMethod) return alert('Please select a payment method');
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/loans/emi-payment', {
                loanId,
                amount: emiAmount,
                paymentMethod
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('EMI successfully paid');
            onRefresh();
            onClose();
            // Reset state
            setStep(1);
            setPaymentMethod('');
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="card glass modal-content" style={{ position: 'relative', overflow: 'hidden', padding: '2rem', maxWidth: '450px', width: '90%' }}>
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="gradient-text">Confirm Payment</h2>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Are you sure you want to pay the EMI for:</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontWeight: 600 }}>{loanPurpose}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem' }}>₹{emiAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                                <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setStep(2)}>
                                    Pay Now <ChevronRight size={18} style={{ marginLeft: '4px' }} />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="method"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>
                                        <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                    <h2 className="gradient-text">Select Method</h2>
                                </div>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {paymentMethods.map(method => (
                                    <div
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            background: paymentMethod === method.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '10px',
                                            border: `1px solid ${paymentMethod === method.id ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ color: paymentMethod === method.id ? '#10b981' : 'var(--text-muted)' }}>
                                            {method.icon}
                                        </div>
                                        <span style={{ fontWeight: 500, color: paymentMethod === method.id ? 'white' : 'var(--text-muted)' }}>{method.name}</span>
                                        {paymentMethod === method.id && <CheckCircle size={18} color="#10b981" style={{ marginLeft: 'auto' }} />}
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                onClick={handlePayment}
                                disabled={loading || !paymentMethod}
                                style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '0.5rem' }}
                            >
                                {loading ? 'Processing...' : `Confirm Payment`}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EMIPaymentModal;
