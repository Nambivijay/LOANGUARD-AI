import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('borrower');
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', { name, email, password, role });
            showToast('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            showToast(error.response?.data?.message || 'Server unreachable or error occurred', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card glass"
                style={{ width: '100%', maxWidth: '400px' }}
            >
                <h2 style={{ marginBottom: '2rem', textAlign: 'center' }} className="gradient-text">Create Account</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <select value={role} onChange={(e) => setRole(e.target.value)} required className="form-select">
                        <option value="borrower">Borrower</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Sign Up</button>
                </form>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
