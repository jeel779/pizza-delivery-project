const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendEmail = async (options) => {
  const { email, subject, text, html } = options;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const mailOptions = {
        from: `"Pizza Store Alert" <${emailUser}>`,
        to: email,
        subject: subject,
        text: text,
        html: html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${email}`);
    } catch (error) {
      console.error('Error sending email via Nodemailer:', error);
      fallbackLog(options);
    }
  } else {
    fallbackLog(options);
  }
};

const fallbackLog = (options) => {
  const { email, subject, text, html } = options;
  const separator = '='.repeat(60);
  const logMessage = `
${separator}
Date: ${new Date().toISOString()}
To: ${email}
Subject: ${subject}
Message Content:
${text || html}
${separator}
`;

  // Output highlighted to console
  console.log("\n\x1b[33m--- MAIL SIMULATOR (No Credentials) ---\x1b[0m");
  console.log(logMessage);
  console.log("\x1b[33m---------------------------------------\x1b[0m\n");

  try {
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logDir, 'sent-emails.log'), logMessage);
  } catch (err) {
    console.error('Failed to write email to fallback log file:', err);
  }
};

module.exports = sendEmail;
