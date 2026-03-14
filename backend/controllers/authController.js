const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const NotificationService = require('../utils/notificationService');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phone
        });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified, isBankLinked: user.isBankLinked, phone: user.phone, borrowerDetails: user.borrowerDetails } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // 'identifier' can be email or phone

        // Find user by email OR phone
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials. Please ensure Email/Phone and Password are correct.' });
        }

        // Generate and send OTP for login (2FA)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExp = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        await NotificationService.sendEmailOTP(user, otp);

        // DO NOT return token here. User must verify OTP first.
        res.json({ message: 'OTP sent to your email. Please verify to complete login.', email: user.email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || user.otpExp < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // OTP is valid
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExp = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isBankLinked: user.isBankLinked,
                phone: user.phone,
                borrowerDetails: user.borrowerDetails
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExp = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        await NotificationService.sendEmailOTP(user, otp);

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.id);

        if (!user || user.otp !== otp || user.otpExp < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExp = undefined;
        await user.save();

        await NotificationService.notify(user._id, {
            title: 'Email Verified',
            message: 'Your email has been successfully verified.',
            type: 'success'
        });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVendors = async (req, res) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).select('name email');
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resendLoginOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate and send new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExp = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        await NotificationService.sendEmailOTP(user, otp);

        res.json({ message: 'OTP resent successfully to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.notifications.forEach(n => {
            n.isRead = true;
        });

        await user.save();
        res.json({ message: 'Notifications marked as read', notifications: user.notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { borrowerDetails, name, phone } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;

        if (borrowerDetails) {
            user.borrowerDetails = {
                ...user.borrowerDetails,
                ...borrowerDetails
            };
        }

        await user.save();

        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.linkBank = async (req, res) => {
    try {
        const { accountNumber, bankName, ifscCode, accountHolderName } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.bankDetails = {
            accountNumber,
            bankName,
            ifscCode,
            accountHolderName
        };
        user.isBankLinked = true;
        await user.save();

        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.json({
            message: 'Bank account linked successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
