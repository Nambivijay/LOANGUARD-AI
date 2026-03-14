import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import UtilizationModal from '../components/UtilizationModal';
import RatingModal from '../components/RatingModal';
import EMIPaymentModal from '../components/EMIPaymentModal';
import LinkBankModal from '../components/LinkBankModal';
import PaymentMethodModal from '../components/PaymentMethodModal';
import { DollarSign, TrendingUp, PieChart, Clock, Upload, Tag, Star, ShieldCheck, Download, Settings, Landmark } from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ user: initialUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUserState] = useState(initialUser);

    useEffect(() => {
        setUserState(initialUser);
    }, [initialUser]);
    const [loans, setLoans] = useState([]);
    const [stats, setStats] = useState({ totalLoan: 0, utilized: 0, remaining: 0 });
    const [isUtilizationModalOpen, setIsUtilizationModalOpen] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    const [vendorViewMode, setVendorViewMode] = useState('active'); // 'active' or 'history'
    const [payments, setPayments] = useState([]);
    const [activeLoanId, setActiveLoanId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingTarget, setRatingTarget] = useState({ vendorId: null, loanId: null, vendorName: '' });
    const [vendorRatings, setVendorRatings] = useState({}); // vendorId -> rating
    const [selectedLoanBills, setSelectedLoanBills] = useState({}); // loanId -> bills[]
    const [loadingBills, setLoadingBills] = useState({});

    // EMI Payment Modal State
    const [isEMIModalOpen, setIsEMIModalOpen] = useState(false);
    const [emiPaymentData, setEmiPaymentData] = useState({ loanId: null, amount: 0, purpose: '' });
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    const [showCertificateLoans, setShowCertificateLoans] = useState({}); // { loanId: boolean }
    const [isLinkBankModalOpen, setIsLinkBankModalOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [eligibilityResult, setEligibilityResult] = useState(null);


    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserState(data); // Use setUserState to update the component's user state
            localStorage.setItem('user', JSON.stringify(data)); // Update localStorage
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Fetch profile error:', error);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/loans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoans(data);
            if (data.length > 0 && !activeLoanId) {
                const approvedLoan = data.find(l => l.status === 'approved');
                setActiveLoanId(approvedLoan ? approvedLoan._id : data[0]._id);
            }
            const total = data.reduce((acc, curr) => acc + (curr.status === 'approved' ? curr.amount : 0), 0);
            const utilizedAmount = data.reduce((acc, curr) => acc + (curr.alreadyUtilized || 0), 0);
            setStats({
                totalLoan: total,
                utilized: utilizedAmount,
                remaining: total - utilizedAmount
            });

            // Fetch ratings for vendors in loans
            data.forEach(loan => {
                if (loan.vendor && !vendorRatings[loan.vendor._id]) {
                    fetchVendorRating(loan.vendor._id);
                }
            });
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const fetchVendorRating = async (vendorId) => {
        try {
            const { data } = await axios.get(`/api/reviews/${vendorId}/stats`);
            setVendorRatings(prev => ({ ...prev, [vendorId]: data.averageRating }));
        } catch (error) {
            console.error('Fetch rating error:', error);
        }
    };

    const fetchPayments = async (loanId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`/api/loans/${loanId}/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(data);
        } catch (error) {
            console.error('Payment fetch error:', error);
        }
    };

    const fetchLoanBills = async (loanId) => {
        try {
            setLoadingBills(prev => ({ ...prev, [loanId]: true }));
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`/api/loans/${loanId}/utilization`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedLoanBills(prev => ({ ...prev, [loanId]: data }));
        } catch (error) {
            console.error('Fetch bills error:', error);
        } finally {
            setLoadingBills(prev => ({ ...prev, [loanId]: false }));
        }
    };

    const handlePayEMI = (loanId, emiAmount, purpose) => {
        if (!user?.isBankLinked) {
            alert('Please link your bank account first before making an EMI payment.');
            setIsLinkBankModalOpen(true);
            return;
        }
        setEmiPaymentData({ loanId, amount: emiAmount, purpose });
        setIsEMIModalOpen(true);
    };

    useEffect(() => {
        if (activeLoanId) {
            fetchPayments(activeLoanId);
            fetchLoanBills(activeLoanId);
        }
    }, [activeLoanId]);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/loans/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(data);
        } catch (error) {
            console.error('Fetch transactions error:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchProfile();
        fetchTransactions();
        
        if (location.state && location.state.eligibilityResult) {
            setEligibilityResult(location.state.eligibilityResult);
            // Clear state to avoid re-showing on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleDownloadCertificate = async (loanId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/loans/${loanId}/certificate`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const isClosed = loans.find(l => l._id === loanId)?.isClosed;
            link.setAttribute('download', `${isClosed ? 'NoDueCertificate' : 'Receipt'}_${loanId}.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed. Please try again.');
        }
    };

    const renderBorrowerDashboard = () => {
        const activeLoan = loans.find(l => l._id === activeLoanId);

        return (
            <div className="dashboard-content-wrapper">
                <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Welcome back, {user?.name || 'User'}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Quick access to your active loan details and statistics.</p>
                    </div>

                    {!user?.isBankLinked && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card glass bank-alert-banner"
                            style={{ 
                                padding: '15px 20px', 
                                border: '1px solid rgba(16, 185, 129, 0.3)', 
                                background: 'rgba(16, 185, 129, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                flex: 1,
                                margin: '0 20px'
                            }}
                        >
                            <Landmark color="#10b981" size={24} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Bank Account Not Linked</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Link your bank account to enable EMI payments and automate your tracking.</div>
                            </div>
                            <button 
                                className="btn-primary" 
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                onClick={() => setIsLinkBankModalOpen(true)}
                            >
                                Link Now
                            </button>
                        </motion.div>
                    )}
                    <div className="dashboard-actions">
                        <button className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }} onClick={() => navigate('/loan-offers')}>
                            <Tag size={16} /> Offers
                        </button>
                        <button className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.9rem' }} onClick={() => navigate('/apply-loan')}>
                            <DollarSign size={16} /> New Loan
                        </button>
                    </div>
                </div>

                {eligibilityResult && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`card glass ${eligibilityResult.eligible ? 'success-card' : 'info-card'}`}
                        style={{ 
                            padding: '1.5rem', 
                            marginBottom: '1.5rem', 
                            border: `1px solid ${eligibilityResult.eligible ? '#10b981' : '#3b82f6'}`,
                            background: `rgba(${eligibilityResult.eligible ? '16, 185, 129' : '59, 130, 246'}, 0.05)`
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px', color: eligibilityResult.eligible ? '#10b981' : '#3b82f6' }}>
                            {eligibilityResult.eligible ? 'Loan Automatically Approved!' : 'Application Under Review'}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{eligibilityResult.message}</p>
                        <button 
                            onClick={() => setEligibilityResult(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline' }}
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}

                <div className="stats-grid">
                    <StatCard icon={<TrendingUp color="#10b981" />} title="Total Loan" value={`₹${stats.totalLoan}`} sub="Approved Total" />
                    <StatCard
                        icon={<PieChart color="#10b981" />}
                        title="Utilized"
                        value={`₹${(stats.utilized || 0).toFixed(2)}`}
                        sub={stats.utilized > 0 ? `${((stats.utilized / (stats.totalLoan || 1)) * 100).toFixed(0)}% of total` : "No utilization yet"}
                    />
                    <StatCard
                        icon={<Clock color="#10b981" />}
                        title="Remaining"
                        value={`₹${(stats.remaining || 0).toFixed(2)}`}
                        sub={stats.totalLoan > 0 ? `${((stats.remaining / stats.totalLoan) * 100).toFixed(0)}% left` : "Available balance"}
                    />
                </div>

                {activeLoan && activeLoan.status === 'approved' && (
                    <div className="card glass loan-details-card">
                        <div className="loan-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Active Loan Details</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{activeLoan.purpose}</p>
                            </div>
                            <div className="loan-emi-info">
                                <div className="loan-emi-value" style={{ fontSize: '1.2rem' }}>EMI: ₹{activeLoan.emi}/mo</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                    {!activeLoan.isClosed && (
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '8px 14px', fontSize: '0.85rem' }} 
                                            onClick={() => handlePayEMI(activeLoan._id, activeLoan.emi, activeLoan.purpose)}
                                        >
                                            Pay EMI
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => handleDownloadCertificate(activeLoan._id)}
                                        className="btn-primary" 
                                        style={{ padding: '8px 14px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                    >
                                        <Download size={14} /> {activeLoan.isClosed ? 'Certificate' : 'Receipt'}
                                    </button>
                                    
                                    <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => {
                                        setSelectedLoanId(activeLoan._id);
                                        setIsUtilizationModalOpen(true);
                                    }}>
                                        <Upload size={14} /> Upload
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="loan-grid-info">
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vendor Details</h4>
                                {activeLoan.vendor ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontWeight: 600 }}>{activeLoan.vendor.name}</div>
                                            {vendorRatings[activeLoan.vendor._id] > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                                    <Star size={14} fill="#fbbf24" strokeWidth={0} />
                                                    {vendorRatings[activeLoan.vendor._id]}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.85rem' }}>{activeLoan.vendor.email}</div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRatingTarget({
                                                    vendorId: activeLoan.vendor._id,
                                                    loanId: activeLoan._id,
                                                    vendorName: activeLoan.vendor.name
                                                });
                                                setIsRatingModalOpen(true);
                                            }}
                                            className="btn-secondary"
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '6px 12px',
                                                marginTop: '10px',
                                                width: 'fit-content',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--primary)',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <Star size={14} style={{ marginRight: '4px' }} /> Rate Vendor
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Pending Assignment</div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Payment Schedule</h4>
                                <div style={{ fontWeight: 600 }}>{activeLoan.tenureMonths} Months</div>
                                <div style={{ fontSize: '0.85rem' }}>{activeLoan.interestRate}% Annual Interest</div>
                                {activeLoan.emiSchedule && activeLoan.emiSchedule.find(e => e.status === 'pending') && (
                                    <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                                        Next Due: {new Date(activeLoan.emiSchedule.find(e => e.status === 'pending').dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Repaid</h4>
                                <div style={{ fontWeight: 600, color: '#10b981' }}>₹{(activeLoan.totalPaid || 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.85rem' }}>Remaining: ₹{(activeLoan.amount - (activeLoan.totalPaid || 0)).toLocaleString()}</div>
                            </div>
                        </div>

                        {activeLoan.emiSchedule && activeLoan.emiSchedule.length > 0 && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>EMI Schedule</h4>
                                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {activeLoan.emiSchedule.map((emi, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{ 
                                                minWidth: '140px', 
                                                padding: '12px', 
                                                background: emi.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', 
                                                borderRadius: '10px',
                                                border: `1px solid ${emi.status === 'paid' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                opacity: emi.status === 'paid' ? 1 : 0.7
                                            }}
                                        >
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMI #{idx + 1}</div>
                                            <div style={{ fontWeight: 700, margin: '4px 0' }}>₹{emi.amount}</div>
                                            <div style={{ fontSize: '0.75rem' }}>{new Date(emi.dueDate).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.7rem', marginTop: '6px', color: emi.status === 'paid' ? '#10b981' : '#f59e0b' }}>
                                                {emi.status.toUpperCase()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="dashboard-two-col">
                    <div className="card glass history-card">
                        <h3 style={{ marginBottom: '1.5rem' }}>EMI Payment History</h3>
                        <div className="scroll-box">
                            {payments.length > 0 ? payments.map(p => (
                                <div key={p._id} className="history-item">
                                    <div>
                                        <div style={{ fontWeight: 600 }}>EMI Payment</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(p.paidAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: '#10b981' }}>+ ₹{p.amount}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.paymentMethod}</div>
                                    </div>
                                </div>
                            )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>No payment history found.</div>}
                        </div>
                    </div>

                    <div className="card glass submissions-card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Bill Submissions</h3>
                        <div className="scroll-box">
                            {activeLoanId && selectedLoanBills[activeLoanId] ? selectedLoanBills[activeLoanId].map(bill => (
                                <div key={bill._id} className="history-item">
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{bill.category}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{bill.amount} - {bill.status.toUpperCase()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {bill.proofImage && <a href={bill.proofImage} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>View Proof</a>}
                                    </div>
                                </div>
                            )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>No bills uploaded for this loan.</div>}
                        </div>
                    </div>
                </div>

                <div className="card glass" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>My Loans</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loans.length > 0 ? loans.map(l => (
                            <div
                                key={l._id}
                                onClick={() => setActiveLoanId(l._id)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: activeLoanId === l._id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    border: `1px solid ${activeLoanId === l._id ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{l.purpose}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: <span style={{ color: l.status === 'approved' ? '#10b981' : l.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>{l.status}</span></div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{l.amount}</div>
                                    <div style={{ fontSize: '0.7rem' }}>{new Date(l.createdAt).toLocaleDateString()}</div>
                                    {l.vendor && vendorRatings[l.vendor._id] > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#fbbf24', fontSize: '0.7rem', justifyContent: 'flex-end', marginTop: '4px' }}>
                                            <Star size={10} fill="#fbbf24" strokeWidth={0} /> {vendorRatings[l.vendor._id]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>No loans found.</div>}
                    </div>
                </div>
            </div>
        );
    };

    const [vendorLoans, setVendorLoans] = useState([]);
    const [reportingId, setReportingId] = useState(null);
    const [suspiciousReason, setSuspiciousReason] = useState('');
    const [adminLoans, setAdminLoans] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [adminDueDays, setAdminDueDays] = useState({}); // loanId -> dueDay

    const fetchVendors = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/auth/vendors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(data);
        } catch (error) {
            console.error('Fetch vendors error:', error);
        }
    };

    const handleAssignVendor = async (loanId, vendorId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/loans/admin/assign-vendor/${loanId}`, { vendorId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdminLoans();
            alert('Vendor assigned successfully');
        } catch (error) {
            alert('Assignment failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const fetchAdminLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/loans/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminLoans(data);
        } catch (error) {
            console.error('Admin fetch error:', error);
        }
    };

    const handleAdminAction = async (loanId, status) => {
        try {
            const token = localStorage.getItem('token');
            const emiDueDay = adminDueDays[loanId];
            await axios.put(`/api/loans/admin/status/${loanId}`, { status, emiDueDay }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdminLoans();
            alert(`Loan ${status} successfully`);
        } catch (error) {
            alert('Action failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const fetchVendorLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/loans/vendor/assigned', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendorLoans(data);
        } catch (error) {
            console.error('Vendor fetch error:', error);
        }
    };

    const handleVerifyBill = async (loanId, billId, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/loans/vendor/utilization/${billId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLoanBills(loanId);
        } catch (error) {
            alert('Verification failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleConfirmUtilization = async (loanId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/loans/vendor/confirm-utilization/${loanId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Loan utilization confirmed successfully');
            fetchVendorLoans();
        } catch (error) {
            alert('Confirmation failed: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchAdminLoans();
            fetchVendors();
        } else if (user?.role === 'vendor') {
            fetchVendorLoans();
        } else {
            fetchData();
        }
    }, [user]);

    const handleVendorAction = async (loanId, actionData) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/loans/vendor/loan/${loanId}`, actionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Status updated successfully');
            fetchVendorLoans();
            setReportingId(null);
            setSuspiciousReason('');
        } catch (error) {
            alert('Update failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const renderVendorDashboard = () => (
        <div className="dashboard-content-wrapper">
            <div className="dashboard-header">
                <h1 className="gradient-text" style={{ fontSize: '1.75rem' }}>Vendor Operations</h1>
                <div className="dashboard-actions">
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                        <button
                            className={vendorViewMode === 'active' ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none' }}
                            onClick={() => setVendorViewMode('active')}
                        >
                            Active
                        </button>
                        <button
                            className={vendorViewMode === 'history' ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none' }}
                            onClick={() => setVendorViewMode('history')}
                        >
                            History
                        </button>
                    </div>
                    <StatCard icon={<TrendingUp color="#10b981" />} title="Assigned" value={vendorLoans.length} sub="Total tasks" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1rem' }}>
                {(vendorViewMode === 'active'
                    ? vendorLoans.filter(l => l.deliveryStatus !== 'delivered')
                    : vendorLoans.filter(l => l.deliveryStatus === 'delivered')
                ).length > 0 ? (vendorViewMode === 'active'
                    ? vendorLoans.filter(l => l.deliveryStatus !== 'delivered')
                    : vendorLoans.filter(l => l.deliveryStatus === 'delivered')
                ).map(loan => (
                    <div key={loan._id} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{loan.purpose}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Customer: {loan.user?.name} ({loan.user?.email})</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>₹{loan.amount}</div>
                                <div style={{ fontSize: '0.8rem', color: loan.paymentConfirmed ? '#10b981' : '#f59e0b' }}>
                                    {loan.paymentConfirmed ? 'Payment Confirmed' : 'Payment Pending'}
                                </div>
                            </div>
                        </div>

                        {/* Bills & Invoices Section */}
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Bills & Invoices</h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => fetchLoanBills(loan._id)}>
                                        {loadingBills[loan._id] ? 'Loading...' : 'Check Files'}
                                    </button>
                                    {!loan.utilizationConfirmed && (
                                        <button
                                            className="btn-primary"
                                            style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                            onClick={() => handleConfirmUtilization(loan._id)}
                                        >
                                            Confirm Final Utilization
                                        </button>
                                    )}
                                </div>
                            </div>

                            {selectedLoanBills[loan._id] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {selectedLoanBills[loan._id].length > 0 ? selectedLoanBills[loan._id].map(bill => (
                                        <div key={bill._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{bill.category}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bill.description} - ₹{bill.amount}</div>
                                                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                                    Status: <span style={{ color: bill.status === 'verified' ? '#10b981' : bill.status === 'flagged' ? '#ef4444' : '#f59e0b' }}>
                                                        {bill.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {bill.proofImage && (
                                                    <a href={bill.proofImage} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>View</a>
                                                )}
                                                <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#10b981' }} onClick={() => handleVerifyBill(loan._id, bill._id, 'verified')}>Verify</button>
                                                <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#ef4444' }} onClick={() => handleVerifyBill(loan._id, bill._id, 'flagged')}>Flag</button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>No bills uploaded for this loan yet.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {reportingId === loan._id && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card glass" style={{ borderColor: '#ef4444' }}>
                                <textarea
                                    placeholder="Provide reason for suspicious activity report..."
                                    value={suspiciousReason}
                                    onChange={(e) => setSuspiciousReason(e.target.value)}
                                    style={{ width: '100%', minHeight: '80px', background: 'transparent', border: 'none', color: 'white', resize: 'vertical' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => handleVendorAction(loan._id, { isSuspicious: true, suspiciousReason })}>Submit Report</button>
                                    <button className="btn-secondary" onClick={() => setReportingId(null)}>Cancel</button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )) : (
                    <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3 style={{ color: 'var(--text-muted)' }}>No assigned loans found.</h3>
                        <p>Wait for the admin to assign you to a loan request.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAdminDashboard = () => (
        <div className="dashboard-content-wrapper">
            <div className="dashboard-header">
                <h1 className="gradient-text" style={{ fontSize: '1.75rem' }}>System Admin Overview</h1>
                <div className="dashboard-actions">
                    <StatCard icon={<TrendingUp color="#ef4444" />} title="Applications" value={adminLoans.length} sub="Total submitted" />
                    <StatCard icon={<Clock color="#8b5cf6" />} title="Pending" value={adminLoans.filter(l => l.status === 'pending').length} sub="Awaiting review" />
                </div>
            </div>

            <div className="card glass" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
                <h3>Loan Applications</h3>
                <div className="table-container" style={{ marginTop: '1.5rem' }}>
                    <table className="admin-table">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <th style={{ padding: '12px' }}>Borrower</th>
                                <th style={{ padding: '12px' }}>Amount</th>
                                <th style={{ padding: '12px' }}>Purpose</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Submitted</th>
                                <th style={{ padding: '12px' }}>Vendor</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adminLoans.length > 0 ? adminLoans.map(loan => (
                                <tr key={loan._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 600 }}>{loan.user?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.user?.email}</div>
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 700 }}>₹{loan.amount.toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{loan.purpose}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            background: loan.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : loan.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: loan.status === 'approved' ? '#10b981' : loan.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                            fontWeight: 600
                                        }}>
                                            {loan.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(loan.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <select
                                            value={loan.vendor?._id || ''}
                                            onChange={(e) => handleAssignVendor(loan._id, e.target.value)}
                                            style={{ padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                                        >
                                            </select>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="28" 
                                                placeholder="Day"
                                                value={adminDueDays[loan._id] || loan.emiDueDay || ''}
                                                onChange={(e) => setAdminDueDays(prev => ({ ...prev, [loan._id]: e.target.value }))}
                                                style={{ width: '60px', padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        {loan.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981' }}
                                                    onClick={() => handleAdminAction(loan._id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }}
                                                    onClick={() => handleAdminAction(loan._id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {loan.status !== 'pending' && (
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                onClick={() => handleAdminAction(loan._id, 'pending')}
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No loan applications found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="dashboard-container">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {user?.role === 'admin' ? renderAdminDashboard() :
                    user?.role === 'vendor' ? renderVendorDashboard() :
                        renderBorrowerDashboard()}

                <UtilizationModal
                    isOpen={isUtilizationModalOpen}
                    onClose={() => setIsUtilizationModalOpen(false)}
                    loanId={selectedLoanId}
                    onRefresh={() => {
                        if (user?.role === 'vendor') fetchVendorLoans();
                        else fetchData();
                        if (activeLoanId) fetchLoanBills(activeLoanId);
                        fetchProfile();
                    }}
                />

                <RatingModal
                    isOpen={isRatingModalOpen}
                    onClose={() => setIsRatingModalOpen(false)}
                    vendorId={ratingTarget.vendorId}
                    loanId={ratingTarget.loanId}
                    vendorName={ratingTarget.vendorName}
                    onReviewSubmitted={() => {
                        if (ratingTarget.vendorId) fetchVendorRating(ratingTarget.vendorId);
                    }}
                />

                <EMIPaymentModal
                    isOpen={isEMIModalOpen}
                    onClose={() => setIsEMIModalOpen(false)}
                    loanId={emiPaymentData.loanId}
                    emiAmount={emiPaymentData.amount}
                    loanPurpose={emiPaymentData.purpose}
                    onRefresh={() => {
                        fetchData();
                        if (emiPaymentData.loanId) {
                            fetchPayments(emiPaymentData.loanId);
                            // Show certificate button for this loan after payment
                            setShowCertificateLoans(prev => ({ ...prev, [emiPaymentData.loanId]: true }));
                        }
                    }}
                />

                    <PaymentMethodModal
                        isOpen={isPaymentMethodModalOpen}
                        onClose={() => setIsPaymentMethodModalOpen(false)}
                        loanId={activeLoanId}
                        onRefresh={fetchData}
                        user={user}
                        onOpenLinkBank={() => {
                            setIsPaymentMethodModalOpen(false);
                            setIsLinkBankModalOpen(true);
                        }}
                    />

                <LinkBankModal
                    isOpen={isLinkBankModalOpen}
                    onClose={() => setIsLinkBankModalOpen(false)}
                    onRefresh={() => {
                        fetchProfile();
                        fetchData();
                    }}
                />
            </motion.div>
            </div>
    );
};

const StatCard = ({ icon, title, value, sub }) => (
    <div className="card glass stat-card">
        <div className="stat-icon">
            {icon}
        </div>
        <div className="stat-info">
            <div className="title">{title}</div>
            <div className="value">{value}</div>
            <div className="sub">{sub}</div>
        </div>
    </div>
);

export default Dashboard;
