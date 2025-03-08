const nodemailer = require("nodemailer");
require('dotenv').config();

// Create a transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", 
  port: 465, 
  secure: true,
  auth: {
    user: "rrpm.noreply@gmail.com",
    pass: process.env.RRPM_MAIL_PWD,
  },
});

// Function to send email
const sendMail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: 'rrpm.noreply@gmail.com', // Sender address
      to, // Receiver email
      subject, // Subject line
      text, // Plain text body
      html, // HTML body
    });

    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

module.exports = sendMail;
