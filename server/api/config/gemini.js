const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGenerativeModel(apiKey) {
    const key = apiKey || process.env.API_KEY;
    if (!key) {
        // Instead of exiting, throw an error that can be caught by the controller
        console.error('API_KEY is missing. Ensure it is set in .env or provided in the form.');
        throw new Error('API_KEY must be provided either in .env or in the form submission.');
    }
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
        generationConfig: { responseMimeType: "application/json" },
    });
}

module.exports = { getGenerativeModel };