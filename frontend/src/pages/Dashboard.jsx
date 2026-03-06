import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, PieChart, Clock } from 'lucide-react';
import LoanRequestModal from '../components/LoanRequestModal';

const Dashboard = ({ user }) => {
    const [loans, setLoans] = useState([]);
    const [stats, setStats] = useState({ totalLoan: 0, utilized: 0, remaining: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://127.0.0.1:5001/api/loans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoans(data);

            const total = data.reduce((acc, curr) => acc + curr.amount, 0);
            setStats({ totalLoan: total, utilized: total * 0.6, remaining: total * 0.4 });
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const chartData = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 700 },
        { name: 'Mar', value: 900 },
        { name: 'Apr', value: 1200 },
        { name: 'May', value: 1500 },
    ];

    const renderBorrowerDashboard = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="gradient-text">Borrower Overview</h1>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <DollarSign size={18} /> Request New Loan
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <StatCard icon={<TrendingUp color="#6366f1" />} title="Total Loan" value={`$${stats.totalLoan}`} sub="Total Approved" />
                <StatCard icon={<PieChart color="#a855f7" />} title="Utilized" value={`$${stats.utilized.toFixed(2)}`} sub="60% of total" />
                <StatCard icon={<Clock color="#22d3ee" />} title="Remaining" value={`$${stats.remaining.toFixed(2)}`} sub="40% left" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card glass" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Utilization Trend</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="card glass" style={{ overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Recent History</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loans.length > 0 ? loans.map(l => (
                            <div key={l._id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{l.purpose}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>${l.amount}</div>
                            </div>
                        )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>No recent loans found.</div>}
                    </div>
                </div>
            </div>
        </>
    );

    const [vendorLoans, setVendorLoans] = useState([]);
    const [reportingId, setReportingId] = useState(null);
    const [suspiciousReason, setSuspiciousReason] = useState('');

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
        if (user?.role === 'vendor') {
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

    const renderVendorDashboard = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="gradient-text">Vendor Operations</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <StatCard icon={<TrendingUp color="#10b981" />} title="Assigned Loans" value={vendorLoans.length} sub="Active tasks" />
                    <StatCard icon={<Clock color="#f59e0b" />} title="Pending Delivery" value={vendorLoans.filter(l => l.deliveryStatus !== 'delivered').length} sub="In progress" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1rem' }}>
                {vendorLoans.length > 0 ? vendorLoans.map(loan => (
                    <div key={loan._id} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{loan.purpose}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Customer: {loan.user?.name} ({loan.user?.email})</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>${loan.amount}</div>
                                <div style={{ fontSize: '0.8rem', color: loan.paymentConfirmed ? '#10b981' : '#f59e0b' }}>
                                    {loan.paymentConfirmed ? 'Payment Confirmed' : 'Payment Pending'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Payment Action</label>
                                <button
                                    className={`btn-${loan.paymentConfirmed ? 'secondary' : 'primary'}`}
                                    onClick={() => handleVendorAction(loan._id, { paymentConfirmed: !loan.paymentConfirmed })}
                                    style={{ width: '100%', fontSize: '0.9rem', padding: '10px' }}
                                >
                                    {loan.paymentConfirmed ? 'Cancel Confirmation' : 'Confirm Payment'}
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Delivery Status</label>
                                <select
                                    value={loan.deliveryStatus}
                                    onChange={(e) => handleVendorAction(loan._id, { deliveryStatus: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Security</label>
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', fontSize: '0.9rem', padding: '10px', background: loan.isSuspicious ? '#ef4444' : 'var(--glass-bg)' }}
                                    onClick={() => setReportingId(loan._id)}
                                >
                                    {loan.isSuspicious ? 'Reported Suspicious' : 'Report Activity'}
                                </button>
                            </div>
                        </div>

                        {/* Bills & Invoices Section */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Bills & Invoices</h4>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => fetchLoanBills(loan._id)}>
                                    {loadingBills[loan._id] ? 'Loading...' : 'Check Files'}
                                </button>
                            </div>

                            {selectedLoanBills[loan._id] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {selectedLoanBills[loan._id].length > 0 ? selectedLoanBills[loan._id].map(bill => (
                                        <div key={bill._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{bill.category}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bill.description} - ${bill.amount}</div>
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
        </>
    );

    const renderAdminDashboard = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="gradient-text">System Admin</h1>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <StatCard icon={<TrendingUp color="#ef4444" />} title="Total Users" value="0" sub="+0 this week" />
                <StatCard icon={<Clock color="#8b5cf6" />} title="System Status" value="Healthy" sub="All systems go" />
                <StatCard icon={<PieChart color="#06b6d4" />} title="Revenue" value="$0" sub="Monthly" />
            </div>
            <div className="card glass">
                <h3>Admin controls</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Full access to system configurations and user management.</p>
            </div>
        </>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {user?.role === 'admin' ? renderAdminDashboard() :
                user?.role === 'vendor' ? renderVendorDashboard() :
                    renderBorrowerDashboard()}

            <LoanRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRefresh={fetchData}
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
