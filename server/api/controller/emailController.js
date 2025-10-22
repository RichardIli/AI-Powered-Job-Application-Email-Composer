const path = require('path');
const { sendEmail } = require('../services/emailServices.js');

/**
 * Provides configuration to the frontend, like if an email user is predefined.
 */
exports.getAppConfig = (req, res) => {
    // --- Temporary Debugging ---
    // Log the status of the required environment variables to the server console.
    console.log('--- Checking .env variables for /api/config ---');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = process.env.EMAIL_SERVICE;
    const apiKey = process.env.API_KEY;
    console.log('EMAIL_USER:', emailUser ? 'Found' : 'MISSING or empty');
    console.log('EMAIL_PASS:', emailPass ? 'Found' : 'MISSING or empty');
    console.log('EMAIL_SERVICE:', emailService ? 'Found' : 'MISSING or empty');
    console.log('API_KEY:', apiKey ? 'Found' : 'MISSING or empty');
    console.log('---------------------------------------------');

    // Credentials are fully predefined if user, pass, and service are in .env
    const hasPredefinedEmail = !!(emailUser && emailPass && emailService);
    const hasPredefinedApiKey = !!apiKey;

    if (hasPredefinedEmail && (!emailUser || !emailPass || !emailService)) {
        console.error('Inconsistent email configuration: EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE must all be defined.');
    }

    if (hasPredefinedApiKey && !apiKey) {
        console.error('Inconsistent API key configuration: API_KEY must be defined.');
    }

    res.json({
        // Let the frontend know if email credentials are set in the environment.
        // Send the email user if it's fully predefined, otherwise null.
        predefinedEmail: hasPredefinedEmail ? process.env.EMAIL_USER : null,
        // Let the frontend know if a CV path is set in the environment
        predefinedCV: process.env.CV_FILE_PATH || null,
        // Let the frontend know if an API key is set in the environment
        predefinedApiKey: hasPredefinedApiKey,
    });
};

/**
 * Retrieves composed email data from the session for the review page.
 */
exports.getReviewData = (req, res) => {
    if (req.session.composedEmail) {
        let cvFilename, cvPath;
        if (process.env.CV_FILE_PATH) {
            // Use the filename from the .env path
            cvFilename = path.basename(process.env.CV_FILE_PATH);
            cvPath = process.env.CV_FILE_PATH;
        } else if (req.session.cvFile) {
            // Use the filename from the uploaded file in the session
            cvFilename = req.session.cvFile.originalname;
            // For uploaded files, we can't provide a direct path to view.
            cvPath = null;
        } else {
            // This case should not be reached if the frontend logic is correct
            // (either CV_FILE_PATH is set, or a file is uploaded).
            return res.status(400).json({ error: 'CV/Resume not found in session or environment variables.' });
        }
        console.log('Serving review data with CV:', cvFilename);
        res.json({
            emailData: req.session.composedEmail,
            // Pass the user's email to pre-fill the "from" field on the review page
            myEmail: req.session.emailCredentials ? req.session.emailCredentials.user : process.env.EMAIL_USER,
            // Pass the CV filename to display on the review page
            cvFilename: cvFilename,
            // Pass the CV path for the "View" button
            cvPath: cvPath
        });
    } else {
        // If there's no data, redirect to the home page
        res.status(404).json({ error: 'No composed email data found in session.' });
    }
};

exports.sendEmailWithAttachedCV = async (req, res) => {
    const { to, subject, text, html } = req.body;

    const attachments = [];
    if (process.env.CV_FILE_PATH) {
        // 1. Use CV from the path specified in .env
        console.log(`Attaching CV from .env path: ${process.env.CV_FILE_PATH}`);
        attachments.push({
            filename: path.basename(process.env.CV_FILE_PATH),
            path: process.env.CV_FILE_PATH
        });
    } else if (req.session.cvFile && req.session.cvFile.buffer) {
        // 2. Use CV from the session (if uploaded)
        console.log(`Attaching CV from session: ${req.session.cvFile.originalname}`);
        // Reconstruct the Buffer from the session data, which is stored as a plain object
        const cvBuffer = Buffer.from(req.session.cvFile.buffer.data);
        attachments.push({
            filename: req.session.cvFile.originalname,
            content: cvBuffer,
            contentType: req.session.cvFile.mimetype
        });
    } else {
        // 3. No CV found. This is a configuration error.
        console.error('Error: No CV available to attach. Neither CV_FILE_PATH nor an uploaded file was found.');
        return res.status(400).send({ error: "CV/Resume not found. Please configure the CV_FILE_PATH in your .env file or upload a CV during the process." });
    }

    try {
        if (!to || !subject || !text) {
            return res.status(400).send({ error: "Missing required fields: to, subject, and either text or html." });
        }

        const mailOptions = {
            from: req.session.emailCredentials ? req.session.emailCredentials.user : process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
            attachments: attachments
        };

        // Use credentials from session if available, otherwise from .env
        const emailCredentials = req.session.emailCredentials || null;

        // The sendEmail service will now handle which credentials to use
        await sendEmail(mailOptions, emailCredentials);

        res.status(200).send("Email sent successfully!");

    } catch (error) {
        console.error('Error in /sendEmail route:', error);
        res.status(500).send({ error: "Failed to send email.", message: error.message });
    }
};