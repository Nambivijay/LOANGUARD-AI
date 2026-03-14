import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

const IntroTransition = ({ onComplete }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
                y: '-100%',
                transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
            }}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#022c22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                overflow: 'hidden'
            }}
        >
            {/* Liquid Background Effect */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 180, 270, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    width: '150%',
                    height: '150%',
                    background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
                    filter: 'blur(80px)',
                }}
            />

            <div style={{ position: 'relative', textAlign: 'center' }}>
                {/* Logo Animation */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2
                    }}
                    style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        position: 'relative',
                        boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)'
                    }}
                >
                    <Wallet size={48} className="gradient-text" style={{ color: '#6366f1' }} />

                    {/* Floating Orbits */}
                    {[0, 120, 240].map((angle, i) => (
                        <motion.div
                            key={i}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                            style={{
                                position: 'absolute',
                                width: '140%',
                                height: '140%',
                                border: '1px solid rgba(34, 211, 238, 0.1)',
                                borderRadius: '50%',
                            }}
                        />
                    ))}
                </motion.div>

                {/* Text Animation */}
                <div style={{ overflow: 'hidden' }}>
                    <motion.h1
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.8, ease: [0.6, 0.01, -0.05, 0.95], delay: 0.5 }}
                        style={{
                            fontSize: '3.5rem',
                            fontWeight: '900',
                            letterSpacing: '0.2em',
                            background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: 0,
                            textTransform: 'uppercase'
                        }}
                    >
                        LOANGUARD
                    </motion.h1>
                </div>

                <div style={{ overflow: 'hidden', marginTop: '0.5rem' }}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        style={{
                            color: '#10b981',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase'
                        }}
                    >
                        Artificial Intelligence
                    </motion.div>
                </div>

                {/* Loading Bar */}
                <div style={{
                    width: '200px',
                    height: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    margin: '3rem auto 0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 0.5
                        }}
                        style={{
                            width: '50%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, #10b981, transparent)'
                        }}
                    />
                </div>
            </div>

            {/* Shutter Exit Effect */}
            <motion.div
                initial={{ scaleY: 0 }}
                exit={{ scaleY: 1 }}
                transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: '#020617',
                    transformOrigin: 'bottom',
                    zIndex: 10
                }}
            />
        </motion.div>
    );
};

export default IntroTransition;


