import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, CheckCircle, ShieldCheck, ArrowRight, Loader } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

const VerificationPage = ({ setUser: setGlobalUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    // Get email from location state if passed from Login
    const loginEmail = location.state?.email;
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || (loginEmail ? { email: loginEmail } : null));

    const [loadingOTP, setLoadingOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(true);

    const handleSendOTP = async () => {
        setLoadingOTP(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = token
                ? '/api/auth/send-otp'
                : '/api/auth/resend-login-otp';

            const payload = token ? {} : { email: user?.email };

            await axios.post(endpoint, payload, token ? {
                headers: { Authorization: `Bearer ${token}` }
            } : {});

            setOtpSent(true);
            showToast('OTP sent to your email!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
        } finally {
            setLoadingOTP(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp) return;
        setLoadingOTP(true);
        try {
            const token = localStorage.getItem('token');
            let response;

            if (token) {
                // Regular verification while logged in
                response = await axios.post('/api/auth/verify-otp', { otp }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Login verification (2FA)
                response = await axios.post('/api/auth/verify-login-otp', { email: user?.email, otp });

                // Save token and user from login response
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                if (setGlobalUser) setGlobalUser(response.data.user);
            }

            showToast('Verified successfully!', 'success');
            const updatedUser = token ? { ...user, isEmailVerified: true } : response.data.user;
            if (token) localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (error) {
            showToast(error.response?.data?.message || 'Invalid OTP', 'error');
        } finally {
            setLoadingOTP(false);
        }
    };

    return (
        <div className="verify-container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card glass verify-card">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={48} color="var(--primary)" />
                    </div>
                    <h1 className="gradient-text">Verify Your Email</h1>
                    <p style={{ color: 'var(--text-muted)' }}>We've sent a 6-digit code to your registered email {user?.email}.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Email Verification Card */}
                    <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ padding: '10px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '12px' }}>
                                    <ShieldCheck size={24} color="var(--accent)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Email Status</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                                </div>
                            </div>
                            {user?.isEmailVerified ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 600 }}>
                                    <CheckCircle size={18} /> Verified
                                </div>
                            ) : (
                                <div style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>Verification Pending</div>
                            )}
                        </div>

                        {!user?.isEmailVerified && (
                            <div style={{ marginTop: '2rem' }}>
                                {!otpSent ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Click below to receive a verification code on your email.</p>
                                        <button
                                            onClick={handleSendOTP}
                                            className="btn-primary"
                                            disabled={loadingOTP}
                                            style={{ width: '100%', justifyContent: 'center', height: '50px', fontSize: '1rem' }}
                                        >
                                            {loadingOTP ? <Loader className="spin" size={18} /> : 'Send OTP'}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter 6-digit OTP"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    style={{ width: '100%', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '8px' }}
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="btn-primary" disabled={loadingOTP} style={{ width: '100%', justifyContent: 'center' }}>
                                                {loadingOTP ? <Loader className="spin" size={18} /> : 'Verify OTP'}
                                            </button>
                                        </form>
                                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                            <button
                                                onClick={handleSendOTP}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                                                disabled={loadingOTP}
                                            >
                                                Resend Code
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ background: 'none', border: '1px solid var(--glass-border)' }}>
                        Back to Dashboard <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                    </button>
                </div>
            </motion.div>
            <style jsx>{`
                .verify-container {
                    max-width: 600px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }
                .verify-card {
                    padding: 3rem;
                }
                @media (max-width: 768px) {
                    .verify-card {
                        padding: 1.5rem;
                    }
                    h1 { font-size: 1.8rem; }
                }
            `}</style>
        </div>
    );
};

export default VerificationPage;
