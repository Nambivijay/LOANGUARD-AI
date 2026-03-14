import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Twitter, Linkedin, Github, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <Shield className="logo-icon" size={32} />
                        <span>LoanGuard <span className="text-secondary-accent">AI</span></span>
                    </Link>
                    <p className="footer-tagline">
                        Decentralized trust and transparent fund utilization tracking for the modern financial ecosystem.
                    </p>
                    <div className="social-links">
                        <a href="#" className="social-icon"><Twitter size={20} /></a>
                        <a href="#" className="social-icon"><Linkedin size={20} /></a>
                        <a href="#" className="social-icon"><Github size={20} /></a>
                    </div>
                </div>

                <div className="footer-links-grid">
                    <div className="footer-nav">
                        <h4>Platform</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/features">Features</Link></li>
                            <li><Link to="/how-it-works">How It Works</Link></li>
                        </ul>
                    </div>
                    <div className="footer-nav">
                        <h4>Account</h4>
                        <ul>
                            <li><Link to="/login">Sign In</Link></li>
                            <li><Link to="/register">Create Account</Link></li>
                            <li><Link to="/apply-loan">Apply for Loan</Link></li>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                        </ul>
                    </div>
                    <div className="footer-contact">
                        <h4>Contact</h4>
                        <ul>
                            <li><Mail size={16} /> support@loanguard.ai</li>
                            <li><Phone size={16} /> +1 (555) 000-0000</li>
                            <li><MapPin size={16} /> Silicon Valley, CA</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} LoanGuard AI. All rights reserved.</p>
                <div className="footer-legal">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
