import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import IntroTransition from './components/IntroTransition';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LoanApplication from './pages/LoanApplication';
import LoanOffers from './pages/LoanOffers';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Profile from './pages/Profile';
import VerificationPage from './pages/VerificationPage';
import ForgotPassword from './pages/ForgotPassword';
import { ToastProvider } from './context/ToastContext';

import Sidebar from './components/Sidebar';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const updatedUser = { ...data, id: data._id }; // Ensure ID consistency
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (error) {
          console.error('Error syncing user profile:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    fetchUser().catch(() => setLoading(false));
  }, []);

  const hasSidebar = user && !loading;

  return (
    <ToastProvider>
      <Router>
        <AnimatePresence mode="wait">
          {loading ? (
            <IntroTransition onComplete={() => setLoading(false)} key="intro-loader" />
          ) : (
            <motion.div 
              key="main-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`app-container ${hasSidebar ? 'has-sidebar' : ''}`}
            >
              {hasSidebar && <Sidebar user={user} setUser={setUser} />}
              <div className="content-wrapper">
                <Navbar user={user} setUser={setUser} />
                <Chatbot user={user} />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
                    <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
                    <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
                    <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
                    <Route path="/loan-offers" element={user ? <LoanOffers /> : <Navigate to="/login" />} />
                    <Route path="/apply-loan" element={user ? <LoanApplication /> : <Navigate to="/login" />} />
                    <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
                    <Route path="/verify" element={<VerificationPage setUser={setUser} />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Routes>
                </main>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Router>
    </ToastProvider>
  );
}

export default App;
