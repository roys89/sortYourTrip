const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load .env from syt-backend root

let transporter;

// Ensure environment variables are loaded
if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_FROM_ADDRESS) {
    console.error('FATAL ERROR: Email environment variables (EMAIL_SERVICE, EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_FROM_ADDRESS) are not defined in .env');
    // Optionally exit process if email is critical
    // process.exit(1);
} else {
    // Configure the transporter (using Gmail in this case)
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // Should be 'gmail'
        auth: {
            user: process.env.EMAIL_USERNAME, // Your Gmail address
            pass: process.env.EMAIL_PASSWORD  // Your Gmail App Password
        },
        // Optional: Add connection timeout
        connectionTimeout: 10000, // 10 seconds
        // Optional: Add socket timeout
        socketTimeout: 10000 // 10 seconds
    });

    // Verify transporter configuration (optional, good for debugging)
    transporter.verify(function(error, success) {
        if (error) {
            console.error('Error verifying email transporter configuration:', error);
        } else {
            console.log('Email transporter is configured correctly and ready to send emails.');
        }
    });
}

/**
 * Sends a password setup email to a newly registered B2C user.
 * 
 * @param {string} toEmail The recipient's email address.
 * @param {string} firstName The recipient's first name.
 * @param {string} setupToken The unique token for the password setup link.
 */
const sendPasswordSetupEmail = async (toEmail, firstName, setupToken) => {
    if (!transporter) {
        console.error('Email transporter is not configured. Cannot send email.');
        throw new Error('Email service is not configured.');
    }

    // --- Construct the password setup link --- 
    // IMPORTANT: Replace 'https://your-b2c-frontend.com' with your actual B2C frontend URL
    const frontendUrl = process.env.B2C_FRONTEND_URL || 'http://localhost:3000'; // Get from env or use default
    const setupLink = `${frontendUrl}/set-password?token=${setupToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM_ADDRESS, // Sender address (e.g., "Sort Your Trip <no-reply@sortyourtrip.com>")
        to: toEmail,                           // Recipient address
        subject: 'Welcome to Sort Your Trip! Set Your Password', // Subject line
        text: `Hello ${firstName},\n\nWelcome! Your account has been created by one of our agents.\nPlease set your password by visiting the following link:\n${setupLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Sort Your Trip Team`, // Plain text body
        html: `<p>Hello ${firstName},</p><p>Welcome! Your account has been created by one of our agents.</p><p>Please set your password by clicking the link below:</p><p><a href="${setupLink}">Set Your Password</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br>The Sort Your Trip Team</p>` // HTML body
    };

    try {
        console.log(`Sending password setup email to ${toEmail}...`);
        let info = await transporter.sendMail(mailOptions);
        console.log('Password setup email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error(`Error sending password setup email to ${toEmail}:`, error);
        // Rethrow the error so the calling function knows sending failed
        throw error; 
    }
};

module.exports = { sendPasswordSetupEmail }; 