import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, LayoutDashboard, User, Bell, Tag, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Navbar.css';

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const notificationRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const { data } = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
        setIsMenuOpen(false);
    };

    const handleBellClick = async () => {
        const nextShow = !showNotifications;
        setShowNotifications(nextShow);

        if (nextShow && unreadCount > 0) {
            try {
                const token = localStorage.getItem('token');
                await axios.put('/api/auth/read-notifications', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Update local state immediately for a responsive feel
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error('Error marking notifications as read:', error);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <nav className="glass navbar">
            <Link to="/" className="nav-brand">
                <Wallet className="brand-icon" size={28} />
                <span className="brand-text">LoanGuard AI</span>
            </Link>

            <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                {user ? (
                    <>
                        <div className="nav-links mobile-only">
                            <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                                <LayoutDashboard size={20} /> Dashboard
                            </Link>

                            {user.role === 'borrower' && (
                                <Link to="/loan-offers" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                                    <Tag size={20} /> Offers
                                </Link>
                            )}
                        </div>

                        <div className="nav-actions">
                            <div style={{ position: 'relative' }} ref={notificationRef}>
                                <button onClick={handleBellClick} className="notification-btn">
                                    <Bell size={22} />
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {/* ... existing notification dropdown code ... */}
                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="notification-dropdown"
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '40px',
                                                width: '300px',
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                padding: '1rem',
                                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                zIndex: 1001
                                            }}
                                        >
                                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                Notifications
                                                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>Latest updates</span>
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {notifications.length > 0 ? (
                                                    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((n, idx) => (
                                                        <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `3px solid ${n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#6366f1'}` }}>
                                                            <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{n.message}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No notifications found</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="user-profile">
                                <User size={18} /> {user.name}
                            </div>
                            <button onClick={handleLogout} className="btn-primary mobile-only" style={{ padding: '8px 16px' }}>
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="nav-actions">
                        <Link to="/login" className="nav-link" style={{ padding: '8px 16px' }} onClick={() => setIsMenuOpen(false)}>Login</Link>
                        <Link to="/register" className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => setIsMenuOpen(false)}>Register</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
