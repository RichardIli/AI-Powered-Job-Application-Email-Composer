const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const { getGenerativeModel } = require('../config/gemini.js');

// Helper to call Gemini API and parse JSON
async function getComposedEmail(prompt, model) {
    if (!model) {
        throw new Error('AI model not provided to getComposedEmail function.');
    }
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    try {
        return JSON.parse(responseText);
    } catch (err) {
        throw new SyntaxError(`Failed to parse JSON response: ${err.message}. Raw response: ${responseText}`);
    }
}

// Helper to extract text from a PDF file
async function extractTextFromPDF(buffer) {
    const data = await pdf(buffer);
    return data.text;
}

// Helper to extract text from an image file using OCR
async function extractTextFromImage(buffer) {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    return text;
}

// Helper to extract text from a Word (.docx) file
async function extractTextFromDocx(buffer) {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value; // The raw text
}

const composedEmailSample = {
    "to": "<email of recepients retreived from jobDetails>",
    "subject": "<ai generated Subject based on the jobDetails>",
    "text": "<composed email body in plain text>",
    "html": "<leave it blank or just dont generate this field>",
    "actionNeeded": "<write a call to action like need to manualy fill a specific field on the generated text email body>"
};

// main function
exports.composeEmail = async (req, res) => {
    try {
        const { jobDetailsText, additionalNotesText, myEmail, userPassword, emailService, apiKey } = req.body;
        const jobDetailsFile = req.files && req.files.jobDetailsFile ? req.files.jobDetailsFile[0] : null;
        const cvFile = req.files && req.files.uploadedFile ? req.files.uploadedFile[0] : null;

        // Get model instance with potential user-provided key
        const model = getGenerativeModel(apiKey);

        if (!jobDetailsText && !jobDetailsFile) {
            return res.status(400).json({ error: "Missing job details (text or file upload)" });
        }

        let myCVContent;
        // Determine the source of the CV content
        if (process.env.CV_FILE_PATH) {
            console.log(`Using CV from .env path: ${process.env.CV_FILE_PATH}`);
            try {
                const cvBuffer = fs.readFileSync(process.env.CV_FILE_PATH);
                myCVContent = await extractTextFromPDF(cvBuffer);
            } catch (e) {
                console.error(`Error reading CV from path: ${process.env.CV_FILE_PATH}`, e);
                return res.status(500).json({ error: `Could not read the CV file specified in .env. Please check the path.` });
            }
        } else if (cvFile) {
            console.log('Using uploaded CV for prompt.');
            myCVContent = await extractTextFromPDF(cvFile.buffer);
        } else {
            // If no .env path and no file uploaded, it's an error.
            return res.status(400).json({ error: "Missing CV/Resume file upload. Please upload a CV or set the CV_FILE_PATH in your .env file." });
        }

        let jobDetailsContent = '';

        if (jobDetailsFile) {
            // Determine file type and extract content
            switch (jobDetailsFile.mimetype) {
                case 'application/pdf':
                    console.log('Processing PDF file.');
                    jobDetailsContent = await extractTextFromPDF(jobDetailsFile.buffer);
                    break;
                case 'image/png':
                case 'image/jpeg':
                case 'image/jpg':
                    console.log('Processing image file using OCR.');
                    jobDetailsContent = await extractTextFromImage(jobDetailsFile.buffer);
                    break;
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx MIME type
                    console.log('Processing Word (.docx) file.');
                    jobDetailsContent = await extractTextFromDocx(jobDetailsFile.buffer);
                    break;
                default:
                    return res.status(400).json({ error: "Unsupported file type" });
            }

            // Create a prompt to summarize the extracted details
            const extractedDetailsPrompt = `Extract the most important details (job title, company, key responsibilities, qualifications, and any contact info) from
            the following job description text and return it as a single block of plain text.

            **Job Description Text:**
            ${jobDetailsContent}`;

            const result = await model.generateContent(extractedDetailsPrompt);
            jobDetailsContent = result.response.text();

        } else {
            // If it's plain text, use it directly
            jobDetailsContent = jobDetailsText;
            console.log('Processing plain text job details.');
        }

        const emailPrompt = `Compose a professional job application email based on the following information. The output must be a valid JSON object.

        **Job Details:**
        ${jobDetailsContent}

        **My CV Content:**
        ${myCVContent}

        **Additional Notes:**
        ${additionalNotesText || 'N/A'}

        Keep the email concise and to the point. The output structure must exactly match the following JSON schema. The "html" field should be left blank or omitted.

        ${JSON.stringify(composedEmailSample, null, 2)}`;

        const emailResponse = await getComposedEmail(emailPrompt, model);

        // Store composed email and credentials in the session
        req.session.composedEmail = emailResponse;

        // Only store the CV in the session if it was uploaded.
        // If using the .env path, the email controller will handle it directly.
        if (cvFile) {
            req.session.cvFile = {
                originalname: cvFile.originalname,
                mimetype: cvFile.mimetype,
                buffer: cvFile.buffer
            };
        } else {
            delete req.session.cvFile; // Ensure no stale CV from a previous session is used
        }

        // Store credentials only if they were provided in the form
        if (myEmail && userPassword && emailService) {
            req.session.emailCredentials = {
                user: myEmail,
                pass: userPassword,
                service: emailService,
            };
        }
        // Save the session before redirecting to ensure data is available on the next page
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session before redirect.' });
            }
            res.redirect('/review.html');
        });

    } catch (error) {
        console.error('Error composing email:', error);
        res.status(500).json({ error: error.message });
    }
};