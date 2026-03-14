import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Shield,
    Zap,
    Lock,
    BarChart,
    ArrowRight,
    CheckCircle,
    MousePointer2,
    Users,
    Activity,
    Globe
} from 'lucide-react';
import Footer from '../components/Footer';
import heroViz from '../assets/hero_viz.png';
import './LandingPage.css';

const LandingPage = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="landing-wrapper">
            {/* Hero Section */}
            <section className="hero-v2">
                <div className="hero-bg-accent"></div>
                <div className="hero-content-v2">
                    <motion.div
                        className="hero-badge-v2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Activity size={14} className="pulse-icon" />
                        <span>The Future of Loan Tracking</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        Smart Financing <br />
                        <span className="gradient-text">Built on Transparency</span>
                    </motion.h1>

                    <motion.p
                        className="hero-subtext"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        LoanGuard AI bridges the gap between disbursement and utilization.
                        Track every rupee, verify every bill, and build financial trust through
                        real-time AI verification.
                    </motion.p>

                    <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Link to="/register" className="btn-premium">
                            Start Tracking Now <ArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="btn-outline">
                            Member Login
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    className="hero-visual-v2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    <div className="abstract-card glass shadow-lg">
                        <img src={heroViz} alt="LoanGuard AI Monitoring" className="hero-viz-img" />
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features-v2">
                <div className="section-title">
                    <span className="subtitle">Core Capabilities</span>
                    <h2>Engineered for Financial Integrity</h2>
                </div>

                <motion.div
                    className="features-grid-v2"
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    {[
                        {
                            icon: <Shield size={32} />,
                            title: "Secure Verification",
                            desc: "End-to-end encrypted bill submission and multi-party verification logic."
                        },
                        {
                            icon: <Zap size={32} />,
                            title: "Instant Processing",
                            desc: "Real-time updates to your loan balance as soon as vendors verify your bills."
                        },
                        {
                            icon: <BarChart size={32} />,
                            title: "Smart Analytics",
                            desc: "Visualize your spending patterns and loan utilization with intuitive data dashboards."
                        },
                        {
                            icon: <Lock size={32} />,
                            title: "Fraud Prevention",
                            desc: "AI-driven anomaly detection to ensure every transaction is legitimate and verified."
                        }
                    ].map((feature, idx) => (
                        <motion.div key={idx} className="feature-card-v2 glass" variants={fadeIn}>
                            <div className="feature-icon-v2">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* How it Works / Roles */}
            <section className="ecosystem">
                <div className="ecosystem-container">
                    <div className="ecosystem-image">
                        <div className="role-showcase glass">
                            <div className="role-toggle">
                                <div className="active">Borrower</div>
                                <div>Vendor</div>
                            </div>
                            <div className="role-content">
                                <ul className="usage-list">
                                    <li><CheckCircle size={18} /> Apply for loans instantly</li>
                                    <li><CheckCircle size={18} /> Upload bills for verification</li>
                                    <li><CheckCircle size={18} /> Track EMI & repayment schedules</li>
                                    <li><CheckCircle size={18} /> Real-time utilization score</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="ecosystem-text">
                        <span className="subtitle">Integrated Ecosystem</span>
                        <h2>A Unified Platform for All Stakeholders</h2>
                        <p>
                            LoanGuard AI isn't just a tracking tool; it's a bridge.
                            Borrowers get lower rates through transparency, and vendors
                            receive guaranteed payments via verified bill processing.
                        </p>
                        <div className="eco-stats">
                            <div className="eco-stat">
                                <h3>99.9%</h3>
                                <span>Accuracy</span>
                            </div>
                            <div className="eco-stat">
                                <h3>24/7</h3>
                                <span>Monitoring</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust / Stats Section */}
            <section className="trust-v2">
                <div className="trust-container glass">
                    <div className="trust-item">
                        <Globe className="trust-icon" />
                        <div>
                            <h4>Global Standards</h4>
                            <p>Compliance with international financial protocols.</p>
                        </div>
                    </div>
                    <div className="trust-item">
                        <Users className="trust-icon" />
                        <div>
                            <h4>User Centric</h4>
                            <p>Designed for ease of use by borrowers and vendors alike.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-v2">
                <div className="cta-box">
                    <h2>Ready to Experience Transparent Finance?</h2>
                    <p>Join thousands of users who trust LoanGuard AI for their financing needs.</p>
                    <Link to="/register" className="btn-premium">
                        Create Your Account <MousePointer2 size={18} />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
