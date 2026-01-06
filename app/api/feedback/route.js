import nodemailer from 'nodemailer';

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

export async function POST(request) {
  try {
    const { email, feedback } = await request.json();

    if (!feedback) {
      return Response.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
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

    // Send email to GeoStats team
    const info = await transporter.sendMail(mailOptions);
    
    // Send confirmation email to the sender (if email provided)
    if (email) {
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Thank You for Your Feedback!</h2>
          <p>Dear User,</p>
          <p>Thank you for taking the time to share your feedback about GeoStats. We truly value your input and will use it to improve our platform.</p>
          <p>Your feedback helps us build a better experience for everyone.</p>
          <p>Best regards,<br>The GeoStats Team</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated confirmation email. Please do not reply to this email.</p>
        </div>
      `;

      const confirmationText = `
Thank You for Your Feedback!

Dear User,

Thank you for taking the time to share your feedback about GeoStats. We truly value your input and will use it to improve our platform.

Your feedback helps us build a better experience for everyone.

Best regards,
The GeoStats Team
      `;

      const confirmationMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank You for Your GeoStats Feedback',
        text: confirmationText,
        html: confirmationHtml,
      };

      // Send confirmation email (don't fail if this fails)
      transporter.sendMail(confirmationMailOptions).catch(err => {
        console.error('Error sending confirmation email:', err);
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Feedback submitted successfully', 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending feedback email:', error);
    return Response.json(
      { error: 'Failed to submit feedback', details: error.message },
      { status: 500 }
    );
  }
}

