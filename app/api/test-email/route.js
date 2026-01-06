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

export async function GET() {
  try {
    await transporter.verify();
    return Response.json({ success: true, message: 'Email server connection successful' });
  } catch (error) {
    return Response.json(
      { error: 'Email server connection failed', details: error.message },
      { status: 500 }
    );
  }
}

