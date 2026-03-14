import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Login = ({ setUser }) => {
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/auth/login', { identifier, password });
            showToast(data.message);
            // Navigate to verify page, passing identifier in state for the OTP verification
            // The verify page will use data.email returned from backend if needed
            navigate('/verify', { state: { email: data.email } });
        } catch (error) {
            showToast(error.response?.data?.message || 'Server unreachable or error occurred', 'error');
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
                <h2 style={{ marginBottom: '2rem', textAlign: 'center' }} className="gradient-text">Welcome Back</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <input
                        type="text"
                        placeholder="Email or Phone Number"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="off"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                    <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                        <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Forgot Password?
                        </Link>
                    </div>
                    <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Sign In</button>
                </form>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
