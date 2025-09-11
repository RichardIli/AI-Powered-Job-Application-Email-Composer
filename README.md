# Job Application Email Composer

A simple and efficient tool to streamline your job application process. This application helps you compose personalized emails, attach your resume, and send them to potential employers directly from a web interface.

## Features

- **Easy Email Composition**: A straightforward web form to write your job application emails.
- **Automatic CV/Resume Attachment**: Automatically attaches your pre-configured CV or Resume to every email.
- **Secure Configuration**: Keep your sensitive credentials like email passwords and API keys safe using environment variables.
- **Flexible Email Service**: Works with various email service providers supported by Nodemailer.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and personal use.

### Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm) installed on your system.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/RichardIli/Job-Application-Email-Composer.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd Job-Application-Email-Composer
    ```

3.  **Install NPM packages:**
    This will install all the necessary dependencies listed in `package.json`.
    ```sh
    npm install
    ```

## Configuration

Before you can run the application, you need to set up your environment variables. These are used to configure the server and your email settings without hard-coding them into the source.

1.  In the root directory of the project, create a new file named `.env`.

2.  Copy the following content into your `.env` file and replace the placeholder values with your own information:

    ```env
    # Server Configuration
    PORT=3000
    SESSION_SECRET=a_long_random_string_for_session_security

    # Email Configuration
    EMAIL_SERVICE=your_email_service_provider # e.g., Gmail, Outlook
    EMAIL_USER=your.email@example.com
    # AI Configuration
    API_KEY=your_ai_api_key # Only if required by your AI service
    GEMINI_MODEL=gemini-2.5-flash (latest)
    EMAIL_PASS=your_email_password_or_app_password

    # Path to your CV/Resume
    CV_FILE_PATH=assets/your_resume_file.pdf (make sure you created an assets folder)
    ```

    **Important Notes:**
    -   `EMAIL_SERVICE`: The service you use to send emails (e.g., 'Gmail'). This should be a service supported by Nodemailer.
    -   `EMAIL_PASS`: For services like Gmail with 2-Factor Authentication (2FA) enabled, you will need to generate an **App Password** and use that here instead of your regular login password.
    -   `CV_FILE_PATH`: Place your CV or Resume (PDF format is recommended) inside the `assets/` directory and update this path to match the filename.

## Usage

Once you have completed the installation and configuration steps, you can start the application.

1.  **Run the server:**
    ```sh
    npm start
    ```

2.  Open your web browser and navigate to `http://localhost:3000` (or whichever port you specified in your `.env` file).

You can now fill out the form and send your job application emails!

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
