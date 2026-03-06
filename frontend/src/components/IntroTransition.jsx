import { motion } from 'framer-motion';

const IntroTransition = ({ onComplete }) => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 2 }}
            onAnimationComplete={onComplete}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{ textAlign: 'center' }}
            >
                <motion.h1
                    style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    LOAN GUARD
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ color: '#94a3b8', marginTop: '1rem' }}
                >
                    Secure • Transparent • Intuitive
                </motion.p>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.8, duration: 1 }}
                    style={{
                        height: '2px',
                        background: '#6366f1',
                        marginTop: '2rem'
                    }}
                />
            </motion.div>
        </motion.div>
    );
};

export default IntroTransition;
