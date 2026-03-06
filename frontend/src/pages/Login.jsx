import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://127.0.0.1:5001/api/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            setUser(data.user);
            showToast('Login Successfully');
            navigate('/dashboard');
        } catch (error) {
            showToast(error.response?.data?.message || 'Server unreachable or error occurred', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card glass"
                style={{ width: '100%', maxWidth: '400px' }}
            >
                <h2 style={{ marginBottom: '2rem', textAlign: 'center' }} className="gradient-text">Welcome Back</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
