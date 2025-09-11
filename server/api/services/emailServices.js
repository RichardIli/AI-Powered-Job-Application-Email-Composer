const nodemailer = require('nodemailer');

/**
 * Sends an email using the pre-configured Nodemailer transporter.
 * @param {object} mailOptions - The email options (to, subject, text, html).
 * @param {object|null} credentials - The user's email credentials { user, pass, service }. If null, uses .env variables.
 * @returns {Promise<object>} A promise that resolves with the email information object.
 */
exports.sendEmail = async (mailOptions, credentials) => {
    try {
        if (!mailOptions.to || !mailOptions.subject || (!mailOptions.text && !mailOptions.html)) {
            throw new Error("Missing required email fields: to, subject, and either text or html.");
        }

        let transporter;

        if (credentials && credentials.user && credentials.pass && credentials.service) {
            // Use credentials provided by the user
            console.log(`Using user-provided credentials for service: ${credentials.service}`);
            transporter = nodemailer.createTransport({
                service: credentials.service,
                auth: {
                    user: credentials.user,
                    pass: credentials.pass,
                },
            });
        } else {
            // Fallback to .env variables
            console.log('Using .env credentials.');
            transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        }

        const info = await transporter.sendMail(mailOptions);

        console.log("Message sent: %s", info.messageId);
        // Returns the info object from Nodemailer
        return info;

    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email. " + error.message);
    }
};
