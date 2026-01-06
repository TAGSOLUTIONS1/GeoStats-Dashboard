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
    const { name, email, organization, role, useCase, message } = await request.json();

    if (!name || !email || !useCase) {
      return Response.json(
        { error: 'Missing required fields: name, email, useCase' },
        { status: 400 }
      );
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

    // Send email to GeoStats team
    const info = await transporter.sendMail(mailOptions);
    
    // Send confirmation email to the sender
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Thank You for Your Interest in GeoStats!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to become a GeoStats Data Partner. We have received your request and will review it within 24-48 hours.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your Request Summary:</strong></p>
          <p><strong>Use Case:</strong> ${useCase}</p>
          ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
        </div>
        <p>We'll be in touch soon to discuss data partnership opportunities.</p>
        <p>Best regards,<br>The GeoStats Team</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated confirmation email. Please do not reply to this email.</p>
      </div>
    `;

    const confirmationText = `
Thank You for Your Interest in GeoStats!

Dear ${name},

Thank you for reaching out to become a GeoStats Data Partner. We have received your request and will review it within 24-48 hours.

Your Request Summary:
Use Case: ${useCase}
${organization ? `Organization: ${organization}` : ''}

We'll be in touch soon to discuss data partnership opportunities.

Best regards,
The GeoStats Team
    `;

    const confirmationMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank You for Your GeoStats Data Partner Request',
      text: confirmationText,
      html: confirmationHtml,
    };

    // Send confirmation email (don't fail if this fails)
    transporter.sendMail(confirmationMailOptions).catch(err => {
      console.error('Error sending confirmation email:', err);
    });

    return Response.json({ 
      success: true, 
      message: 'Contact request submitted successfully', 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending contact email:', error);
    return Response.json(
      { error: 'Failed to submit contact request', details: error.message },
      { status: 500 }
    );
  }
}

