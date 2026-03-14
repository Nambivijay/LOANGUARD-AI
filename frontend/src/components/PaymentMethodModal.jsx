import React, { useState } from 'react';
import axios from 'axios';
import { X, CreditCard, Landmark, Wallet } from 'lucide-react';

const PaymentMethodModal = ({ isOpen, onClose, loanId, onRefresh, user, onOpenLinkBank }) => {
    const [method, setMethod] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!method) return alert('Please select a payment method');
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put('/api/loans/payment-method', 
                { loanId, paymentMethod: method },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onRefresh();
            onClose();
        } catch (error) {
            alert('Error updating payment method');
        } finally {
            setLoading(false);
        }
    };

    const methods = [
        { id: 'Bank Account', icon: <Landmark size={20} />, label: 'Bank Account' },
        { id: 'Card', icon: <CreditCard size={20} />, label: 'Credit/Debit Card' },
        { id: 'UPI', icon: <Wallet size={20} />, label: 'UPI' }
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
                <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Setup Payment Method</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select your preferred method for automatic EMI deductions.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {methods.map(m => (
                        <div 
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '15px',
                                borderRadius: '12px',
                                background: method === m.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${method === m.id ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ color: method === m.id ? '#10b981' : 'var(--text-muted)' }}>{m.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: method === m.id ? 'white' : 'var(--text-muted)' }}>{m.label}</div>
                                {m.id === 'Bank Account' && method === 'Bank Account' && !user?.isBankLinked && (
                                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>Account not linked yet</div>
                                )}
                            </div>
                            {m.id === 'Bank Account' && method === 'Bank Account' && !user?.isBankLinked && (
                                <button 
                                    className="btn-primary" 
                                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenLinkBank();
                                    }}
                                >
                                    Link Now
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    disabled={loading || !method}
                    onClick={handleSave}
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '2rem', opacity: (!method || loading) ? 0.6 : 1 }}
                >
                    {loading ? 'Saving...' : 'Save Preference'}
                </button>
            </div>
        </div>
    );
};

export default PaymentMethodModal;
