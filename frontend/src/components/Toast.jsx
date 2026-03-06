import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    const isSuccess = type === 'success';

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    minWidth: '300px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    background: 'rgba(15, 23, 42, 0.9)',
                    pointerEvents: 'auto'
                }}
            >
                {isSuccess ? (
                    <CheckCircle size={24} color="#22c55e" />
                ) : (
                    <XCircle size={24} color="#ef4444" />
                )}

                <div style={{ flex: 1 }}>
                    <p style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: isSuccess ? '#e8f5e9' : '#fdeded'
                    }}>
                        {message}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                    }}
                >
                    <X size={18} />
                </button>
            </motion.div>
        </div>
    );
};

export default Toast;
