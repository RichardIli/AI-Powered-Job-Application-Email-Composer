// routes/routes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path'); // Add path module
const { composeEmail } = require('../controller/email_compose_by_gemini.js');
const { getAppConfig, getReviewData, sendEmailWithAttachedCV } = require('../controller/emailController.js');

// home
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Set up multer to handle file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store the file in memory as a buffer

// Use the upload middleware for your route
// 'jobDetailsFile' is the name of the input field in your HTML form
router.post('/compose-email', upload.fields([
    { name: 'jobDetailsFile', maxCount: 1 },
    { name: 'uploadedFile', maxCount: 1 }
]), composeEmail);

// A new route to provide frontend configuration
router.get('/api/config', getAppConfig);

// A new route to get data for the review page from the session
router.get('/api/review-data', getReviewData);

// Send the email after checking the email content
router.post('/sendEmail', sendEmailWithAttachedCV);

module.exports = router;