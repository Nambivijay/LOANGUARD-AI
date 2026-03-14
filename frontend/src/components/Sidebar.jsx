import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Tag,
    FileText,
    User,
    LogOut,
    Wallet,
    Bell,
    Settings,
    ShieldCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, setUser }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/loan-offers', icon: <Tag size={20} />, label: 'Loan Offers', roles: ['borrower'] },
        { path: '/apply-loan', icon: <FileText size={20} />, label: 'Apply Loan', roles: ['borrower'] },
        { path: '/vendors', icon: <ShieldCheck size={20} />, label: 'Vendors', roles: ['admin'] },
        { path: '/profile', icon: <User size={20} />, label: 'My Profile' },
    ];

    const filteredItems = menuItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <aside className="sidebar glass">
            <div className="sidebar-brand">
                <Wallet className="brand-icon" size={28} />
                <span className="brand-text">LoanGuard AI</span>
            </div>

            <nav className="sidebar-nav">
                {filteredItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">
                        <User size={18} />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="sidebar-logout">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
