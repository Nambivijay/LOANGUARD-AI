const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Better debugging for unexpected crashes
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));

app.get('/', (req, res) => {
    res.send('Loan Utilization API is running...');
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loan-tracking')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please kill the process using this port and try again.`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});
