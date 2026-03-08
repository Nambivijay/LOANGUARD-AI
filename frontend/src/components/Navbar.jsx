import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, LayoutDashboard, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const { data } = await axios.get('http://127.0.0.1:5001/api/auth/me', {
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
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1000 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
                <Wallet className="gradient-text" size={32} />
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>LOAN GUARD</span>
            </Link>

            {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>

                    <div style={{ position: 'relative' }} ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
                        >
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '10px', fontWeight: 700 }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
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
                                        overflowY: 'auto'
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)' }}>
                        <User size={18} /> {user.name}
                    </div>
                    <button onClick={handleLogout} className="btn-primary" style={{ padding: '8px 16px' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/login" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px' }}>Login</Link>
                    <Link to="/register" className="btn-primary" style={{ padding: '8px 16px' }}>Register</Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
