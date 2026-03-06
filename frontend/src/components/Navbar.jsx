import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, LayoutDashboard, User } from 'lucide-react';

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return (
        <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
                <Wallet className="gradient-text" size={32} />
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>LOAN GUARD</span>
            </Link>

            {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    {user.role === 'borrower' && (
                        <Link to="/apply-loan" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Apply for Loan
                        </Link>
                    )}
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
