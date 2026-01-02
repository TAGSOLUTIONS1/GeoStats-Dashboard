const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Contact Form - Data Partner Request
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, organization, role, useCase, message } = req.body;

    if (!name || !email || !useCase) {
      return res.status(400).json({ error: 'Missing required fields: name, email, useCase' });
    }

    const recipientEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New GeoStats Data Partner Request</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
          ${role ? `<p><strong>Role:</strong> ${role}</p>` : ''}
          <p><strong>Use Case:</strong> ${useCase}</p>
          ${message ? `<p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
        <p style="color: #6b7280; font-size: 12px;">This email was sent from the GeoStats contact form.</p>
      </div>
    `;

    const textContent = `
New GeoStats Data Partner Request

Name: ${name}
Email: ${email}
${organization ? `Organization: ${organization}` : ''}
${role ? `Role: ${role}` : ''}
Use Case: ${useCase}
${message ? `Message: ${message}` : ''}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      replyTo: email,
      subject: `New Data Partner Request from ${name}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Contact request submitted successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ error: 'Failed to submit contact request', details: error.message });
  }
});

// Feedback API
app.post('/api/feedback', async (req, res) => {
  try {
    const { email, feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    const recipientEmail = process.env.FEEDBACK_EMAIL || process.env.EMAIL_USER;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New GeoStats App Feedback</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${email ? `<p><strong>Email:</strong> ${email}</p>` : '<p><strong>Email:</strong> Not provided</p>'}
          <p><strong>Feedback:</strong><br>${feedback.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">This feedback was submitted from the GeoStats application.</p>
      </div>
    `;

    const textContent = `
New GeoStats App Feedback

${email ? `Email: ${email}` : 'Email: Not provided'}
Feedback: ${feedback}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      ...(email && { replyTo: email }),
      subject: `GeoStats App Feedback${email ? ` from ${email}` : ''}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Feedback submitted successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending feedback email:', error);
    res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
  }
});

// Test email connection
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Email server connection successful' });
  } catch (error) {
    res.status(500).json({ error: 'Email server connection failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

