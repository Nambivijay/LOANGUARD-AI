import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const LoanRequestModal = ({ isOpen, onClose, onRefresh }) => {
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [tenure, setTenure] = useState(12);

    if (!isOpen) return null;

    const calculateEMI = () => {
        if (!amount || !tenure) return 0;
        const loanAmount = Number(amount);
        const monthlyRate = 12 / 12 / 100; // 12% annual rate default
        const months = Number(tenure);
        const emiValue = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        return Math.round(emiValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/loans',
                { amount, purpose, tenureMonths: tenure, interestRate: 12 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onRefresh();
            onClose();
        } catch (error) {
            alert('Error requesting loan');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Request Loan</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loan Amount (₹)</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 200000" style={{ width: '100%' }} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tenure (Months)</label>
                        <select value={tenure} onChange={(e) => setTenure(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '12px' }}>
                            <option value={6}>6 Months</option>
                            <option value={12}>12 Months</option>
                            <option value={24}>24 Months</option>
                            <option value={36}>36 Months</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Purpose</label>
                        <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Business Expansion" style={{ width: '100%' }} required />
                    </div>

                    {amount && (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Monthly EMI</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>₹{calculateEMI().toLocaleString()}</div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>Submit Application</button>
                </form>
            </div>
        </div>
    );
};

export default LoanRequestModal;
