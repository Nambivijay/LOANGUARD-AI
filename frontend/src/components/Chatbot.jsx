import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, X, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: `Hi ${user?.name || 'there'}! I'm your LoanGuard AI Assistant. How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post('/api/ai/chat', { message: input }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="chatbot-container">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="chatbot-window glass"
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MessageSquare size={20} />
                                <span style={{ fontWeight: 600 }}>LoanGuard AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="chatbot-close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`chat-message ${m.role}`}>
                                    {m.content}
                                </div>
                            ))}
                            {loading && (
                                <div className="chat-loading">
                                    <div className="loader" />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="chatbot-input-form">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message..."
                            />
                            <button type="submit" className="btn-primary" disabled={loading}>
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="chatbot-trigger"
                    >
                        <MessageSquare size={28} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
