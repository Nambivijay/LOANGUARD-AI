const User = require('../models/User');
const nodemailer = require('nodemailer');

/**
 * Notification Service
 * Handles In-App, Real Email (via Nodemailer), and Mock SMS.
 */
class NotificationService {
    static async getTransporter() {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return null;
        }
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    static async notify(userId, { title, message, type = 'info', channels = ['in-app'] }) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            // 1. In-App Notification
            if (channels.includes('in-app')) {
                user.notifications.unshift({
                    message: `${title ? title + ': ' : ''}${message}`,
                    type,
                    createdAt: new Date()
                });
                await user.save();
            }

            // 2. Real Email (if configured) - Used for general updates
            if (channels.includes('email')) {
                const transporter = await this.getTransporter();
                if (transporter) {
                    try {
                        await transporter.sendMail({
                            from: `"LoanGuard Admin" <${process.env.SMTP_USER}>`,
                            to: user.email,
                            subject: title || 'LoanGuard Notification',
                            text: message,
                            html: `<b>${title || 'Notification'}</b><p>${message}</p>`
                        });
                        console.log(`✅ Real email sent to ${user.email}`);
                    } catch (err) {
                        console.error('❌ Failed to send real email:', err.message);
                    }
                } else {
                    console.log('----------------------------------------------------');
                    console.log(`📧 MOCK EMAIL (No SMTP Credentials): ${user.email}`);
                    console.log(`Subject: ${title || 'Notification'}`);
                    console.log(`Message: ${message}`);
                    console.log('----------------------------------------------------');
                }
            }

            // 3. SMS Mock (Real SMS would require Twilio API key)
            if (channels.includes('sms')) {
                const phone = user.phone || 'N/A';
                console.log('----------------------------------------------------');
                console.log(`📱 MOCK SMS SENT TO: ${phone}`);
                console.log(`Message: ${title ? title + ': ' : ''}${message}`);
                console.log('----------------------------------------------------');
            }

        } catch (error) {
            console.error('Error in NotificationService:', error);
        }
    }

    // Removed sendVerificationEmail as we are now Phone-Only OTP

    static async sendEmailOTP(user, otp) {
        const timestamp = new Date().toLocaleString();
        const message = `Your LoanGuard verification code is: ${otp}`;

        console.log('\n' + '='.repeat(50));
        console.log(`📧 REAL-TIME EMAIL OTP SIMULATION [${timestamp}]`);
        console.log(`To: ${user.email}`);
        console.log(`Message: ${message}`);
        console.log('='.repeat(50) + '\n');

        // Logic for real email sending via transporter if available
        const transporter = await this.getTransporter();
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: `"LoanGuard Admin" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: 'Your Login OTP',
                    text: message,
                    html: `<b>${message}</b>`
                });
            } catch (err) {
                console.error('❌ Failed to send real OTP email:', err.message);
            }
        }

        user.notifications.unshift({
            message: `A verification OTP was sent to your email at ${timestamp}.`,
            type: 'warning'
        });
        await user.save();
    }
}

module.exports = NotificationService;
