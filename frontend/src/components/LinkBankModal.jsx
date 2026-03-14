import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, CreditCard, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const LinkBankModal = ({ isOpen, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        accountHolderName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/auth/link-bank', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
            onClose();
            alert('Bank account linked successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to link bank account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="modal-content glass"
                        style={{ maxWidth: '450px' }}
                    >
                        <div className="modal-header">
                            <div className="header-title-group">
                                <Landmark className="header-icon" size={24} />
                                <div>
                                    <h2>Link Bank Account</h2>
                                    <p>Connect your bank to enable EMI payments</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {error && <div className="error-message">{error}</div>}
                            
                            <div className="form-group">
                                <label>Account Holder Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter name as per bank records"
                                    value={formData.accountHolderName}
                                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Bank Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. HDFC Bank, SBI"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter account number"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>IFSC Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. HDFC0001234"
                                        value={formData.ifscCode}
                                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="security-note" style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                padding: '12px', 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                borderRadius: '8px',
                                marginBottom: '20px',
                                fontSize: '0.85rem',
                                color: '#10b981'
                            }}>
                                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                                <p>Your bank details are encrypted and stored safely. We use this only for EMI processing.</p>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Linking...' : 'Link Bank Account'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LinkBankModal;
