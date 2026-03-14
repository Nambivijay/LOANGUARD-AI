import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return showToast('Passwords do not match', 'error');
        }

        setLoading(true);
        try {
            const { data } = await axios.post('/api/auth/reset-password', {
                email,
                newPassword,
                confirmPassword
            });
            showToast(data.message);
            navigate('/login');
        } catch (error) {
            showToast(error.response?.data?.message || 'Error resetting password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card glass"
                style={{ width: '100%', maxWidth: '400px' }}
            >
                <h2 style={{ marginBottom: '2rem', textAlign: 'center' }} className="gradient-text">Reset Password</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Remember your password? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Back to Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
