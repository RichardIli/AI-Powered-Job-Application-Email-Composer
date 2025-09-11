// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session'); // Add session middleware

// Load environment variables from a .env file
dotenv.config();

const routes = require('./api/routes/routes.js');

// Initialize the Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse URL-encoded bodies (from form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this line to parse JSON bodies

// Use session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey', // Use a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Set to true in production with HTTPS
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Also serve the 'assets' directory for files like the CV
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));

// Routes
app.use('/', routes);

// Start the server and listen for requests
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});