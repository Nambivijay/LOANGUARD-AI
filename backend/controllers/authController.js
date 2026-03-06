const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password, role });
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        console.log('Login attempt for:', req.body.email);
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user || !(await user.comparePassword(password))) {
            console.log('Invalid credentials');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Generating token...');
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
};
