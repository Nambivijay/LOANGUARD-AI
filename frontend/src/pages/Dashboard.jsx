import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, PieChart, Clock, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UtilizationModal from '../components/UtilizationModal';

const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [stats, setStats] = useState({ totalLoan: 0, utilized: 0, remaining: 0 });
    const [isUtilizationModalOpen, setIsUtilizationModalOpen] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    const [vendorViewMode, setVendorViewMode] = useState('active'); // 'active' or 'history'
    const [payments, setPayments] = useState([]);
    const [activeLoanId, setActiveLoanId] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://127.0.0.1:5001/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Profile fetch error:', error);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://127.0.0.1:5001/api/loans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoans(data);
            if (data.length > 0 && !activeLoanId) setActiveLoanId(data[0]._id);
            const total = data.reduce((acc, curr) => acc + (curr.status === 'approved' ? curr.amount : 0), 0);
            const utilizedAmount = data.reduce((acc, curr) => acc + (curr.alreadyUtilized || 0), 0);
            setStats({
                totalLoan: total,
                utilized: utilizedAmount,
                remaining: total - utilizedAmount
            });
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const fetchPayments = async (loanId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://127.0.0.1:5001/api/loans/${loanId}/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(data);
        } catch (error) {
            console.error('Payment fetch error:', error);
        }
    };

    const handlePayEMI = async (loanId, emiAmount) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5001/api/loans/emi-payment', { loanId, amount: emiAmount }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('EMI Paid successfully');
            fetchPayments(loanId);
            fetchData();
        } catch (error) {
            alert('Payment failed: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        if (activeLoanId) {
            fetchPayments(activeLoanId);
            fetchLoanBills(activeLoanId);
        }
    }, [activeLoanId]);

    useEffect(() => {
        fetchData();
        fetchProfile();
    }, []);

    const chartData = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 700 },
        { name: 'Mar', value: 900 },
        { name: 'Apr', value: 1200 },
        { name: 'May', value: 1500 },
    ];

    const renderBorrowerDashboard = () => {
        const activeLoan = loans.find(l => l._id === activeLoanId);

        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="gradient-text">Borrower Overview</h1>
                    <button className="btn-primary" onClick={() => navigate('/apply-loan')}>
                        <DollarSign size={18} /> Apply for New Loan
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <StatCard icon={<TrendingUp color="#6366f1" />} title="Total Loan" value={`₹${stats.totalLoan}`} sub="Approved Total" />
                    <StatCard
                        icon={<PieChart color="#a855f7" />}
                        title="Utilized"
                        value={`₹${stats.utilized.toFixed(2)}`}
                        sub={stats.utilized > 0 ? `${((stats.utilized / (stats.totalLoan || 1)) * 100).toFixed(0)}% of total` : "No utilization yet"}
                    />
                    <StatCard
                        icon={<Clock color="#22d3ee" />}
                        title="Remaining"
                        value={`₹${stats.remaining.toFixed(2)}`}
                        sub={stats.totalLoan > 0 ? `${((stats.remaining / stats.totalLoan) * 100).toFixed(0)}% left` : "Available balance"}
                    />
                </div>

                {activeLoan && activeLoan.status === 'approved' && (
                    <div className="card glass" style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Approved Loan Details</h3>
                                <p style={{ color: 'var(--text-muted)' }}>{activeLoan.purpose}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>EMI: ₹{activeLoan.emi}/mo</div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                    <button className="btn-primary" onClick={() => handlePayEMI(activeLoan._id, activeLoan.emi)}>Pay EMI</button>
                                    <button className="btn-secondary" onClick={() => {
                                        setSelectedLoanId(activeLoan._id);
                                        setIsUtilizationModalOpen(true);
                                    }}>
                                        <Upload size={16} style={{ marginRight: '8px' }} /> Upload Bill
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vendor Details</h4>
                                {activeLoan.vendor ? (
                                    <>
                                        <div style={{ fontWeight: 600 }}>{activeLoan.vendor.name}</div>
                                        <div style={{ fontSize: '0.85rem' }}>{activeLoan.vendor.email}</div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Pending Assignment</div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Payment Schedule</h4>
                                <div style={{ fontWeight: 600 }}>{activeLoan.tenureMonths} Months</div>
                                <div style={{ fontSize: '0.85rem' }}>{activeLoan.interestRate}% Annual Interest</div>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Repaid</h4>
                                <div style={{ fontWeight: 600, color: '#10b981' }}>₹{(activeLoan.totalPaid || 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.85rem' }}>Remaining: ₹{(activeLoan.amount - (activeLoan.totalPaid || 0)).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div className="card glass" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>EMI Payment History</h3>
                        <div style={{ overflowY: 'auto', height: '85%' }}>
                            {payments.length > 0 ? payments.map(p => (
                                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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

                    <div className="card glass" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Bill Submissions</h3>
                        <div style={{ overflowY: 'auto', height: '85%' }}>
                            {activeLoanId && selectedLoanBills[activeLoanId] ? selectedLoanBills[activeLoanId].map(bill => (
                                <div key={bill._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{bill.category}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{bill.amount} - {bill.status.toUpperCase()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {bill.proofImage && <a href={`http://127.0.0.1:5001${bill.proofImage}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>View Proof</a>}
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
                                    background: activeLoanId === l._id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    border: `1px solid ${activeLoanId === l._id ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
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
                                </div>
                            </div>
                        )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>No loans found.</div>}
                    </div>
                </div>
            </>
        );
    };

    const [vendorLoans, setVendorLoans] = useState([]);
    const [reportingId, setReportingId] = useState(null);
    const [suspiciousReason, setSuspiciousReason] = useState('');
    const [adminLoans, setAdminLoans] = useState([]);
    const [vendors, setVendors] = useState([]);

    const fetchVendors = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://127.0.0.1:5001/api/auth/vendors', {
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
            await axios.put(`http://127.0.0.1:5001/api/loans/admin/assign-vendor/${loanId}`, { vendorId }, {
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
            const { data } = await axios.get('http://127.0.0.1:5001/api/loans/admin/all', {
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
            await axios.put(`http://127.0.0.1:5001/api/loans/admin/status/${loanId}`, { status }, {
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
            const { data } = await axios.get('http://127.0.0.1:5001/api/loans/vendor/assigned', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendorLoans(data);
        } catch (error) {
            console.error('Vendor fetch error:', error);
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
            await axios.put(`http://127.0.0.1:5001/api/loans/vendor/loan/${loanId}`, actionData, {
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

    const [selectedLoanBills, setSelectedLoanBills] = useState({}); // loanId -> bills[]
    const [loadingBills, setLoadingBills] = useState({});

    const fetchLoanBills = async (loanId) => {
        try {
            setLoadingBills(prev => ({ ...prev, [loanId]: true }));
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://127.0.0.1:5001/api/loans/${loanId}/utilization`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedLoanBills(prev => ({ ...prev, [loanId]: data }));
        } catch (error) {
            console.error('Fetch bills error:', error);
        } finally {
            setLoadingBills(prev => ({ ...prev, [loanId]: false }));
        }
    };

    const handleVerifyBill = async (loanId, billId, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://127.0.0.1:5001/api/loans/vendor/utilization/${billId}`, { status }, {
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
            await axios.put(`http://127.0.0.1:5001/api/loans/vendor/confirm-utilization/${loanId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Loan utilization confirmed successfully');
            fetchVendorLoans();
        } catch (error) {
            alert('Confirmation failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const renderVendorDashboard = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="gradient-text">Vendor Operations</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
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
                                                    <a href={`http://127.0.0.1:5001${bill.proofImage}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>View</a>
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
        </>
    );

    const renderAdminDashboard = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="gradient-text">System Admin Overview</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <StatCard icon={<TrendingUp color="#ef4444" />} title="Applications" value={adminLoans.length} sub="Total submitted" />
                    <StatCard icon={<Clock color="#8b5cf6" />} title="Pending" value={adminLoans.filter(l => l.status === 'pending').length} sub="Awaiting review" />
                </div>
            </div>

            <div className="card glass" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
                <h3>Loan Applications</h3>
                <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                                            <option value="">Assign Vendor</option>
                                            {vendors.map(v => (
                                                <option key={v._id} value={v._id}>{v.name}</option>
                                            ))}
                                        </select>
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
        </>
    );

    return (
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
        </motion.div>
    );
};

const StatCard = ({ icon, title, value, sub }) => (
    <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>
        </div>
    </div>
);

export default Dashboard;
