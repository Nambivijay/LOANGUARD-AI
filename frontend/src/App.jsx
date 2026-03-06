import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntroTransition from './components/IntroTransition';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LoanApplication from './pages/LoanApplication';
import Navbar from './components/Navbar';
import { ToastProvider } from './context/ToastContext';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  return (
    <ToastProvider>
      <Router>
        {loading && <IntroTransition onComplete={() => setLoading(false)} />}
        <div className={`app-container ${loading ? 'hidden' : 'visible'}`}>
          <Navbar user={user} setUser={setUser} />
          <main style={{ padding: '2rem' }}>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/apply-loan" element={user ? <LoanApplication /> : <Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
