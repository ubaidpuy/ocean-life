import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validate SMTP configuration
const validateSMTPConfig = () => {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ SMTP Configuration Error: Missing required environment variables:', missing.join(', '));
    console.error('Please set the following in your .env file:');
    console.error('  SMTP_HOST=your-smtp-host');
    console.error('  SMTP_PORT=587 (or 465 for SSL)');
    console.error('  SMTP_USER=your-email@gmail.com');
    console.error('  SMTP_PASS=your-app-password');
    console.error('  SMTP_SECURE=false (true for SSL/465, false for TLS/587)');
    console.error('  SMTP_FROM_EMAIL=your-email@gmail.com (optional)');
    console.error('  SMTP_FROM_NAME=Your App Name (optional)');
    return false;
  }
  return true;
};

// Create reusable transporter object using SMTP transport
let transporter = null;

if (validateSMTPConfig()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add debug option for troubleshooting
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  });

  // Verify SMTP connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ SMTP connection error:', error.message);
      console.error('Full error:', error);
    } else {
      console.log('✅ SMTP server is ready to send emails');
      console.log('   Host:', process.env.SMTP_HOST);
      console.log('   Port:', process.env.SMTP_PORT || 587);
      console.log('   User:', process.env.SMTP_USER);
    }
  });
} else {
  console.error('⚠️  Email service is disabled due to missing SMTP configuration');
}

/**
 * Send email verification email
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} verificationToken - Email verification token
 * @param {string} storeSubdomain - Store subdomain (optional, for multi-tenant)
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendVerificationEmail = async (email, name, verificationToken, storeSubdomain = null) => {
  // Check if transporter is configured
  if (!transporter) {
    const error = new Error('SMTP is not configured. Please set SMTP environment variables.');
    console.error('❌ Cannot send verification email:', error.message);
    throw error;
  }

  try {
    // Get base URL from environment or use default
    let baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Parse baseUrl to extract components
    let baseUrlObj;
    try {
      baseUrlObj = new URL(baseUrl);
    } catch (e) {
      // If baseUrl is not a valid URL, construct it
      baseUrlObj = new URL('http://localhost:3000');
    }
    
    // Use protocol from baseUrl, or default based on NODE_ENV
    const protocol = baseUrlObj.protocol.replace(':', '') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    
    // If store subdomain is provided, construct store subdomain URL
    let verificationUrl = '';
    if (storeSubdomain) {
      const port = baseUrlObj.port ? `:${baseUrlObj.port}` : '';
      // Handle localhost subdomains
      if (baseUrlObj.hostname.includes('localhost') || baseUrlObj.hostname === 'localhost') {
        verificationUrl = `${protocol}://${storeSubdomain}.localhost${port}`;
      } else if (baseUrlObj.hostname.includes('.myapp.local')) {
        verificationUrl = `${protocol}://${storeSubdomain}.myapp.local${port}`;
      } else {
        // For production, construct subdomain URL
        const parts = baseUrlObj.hostname.split('.');
        const baseDomain = parts.slice(-2).join('.');
        verificationUrl = `${protocol}://${storeSubdomain}.${baseDomain}${port}`;
      }
    } else {
      verificationUrl = baseUrl;
    }
    
    const verificationLink = `${verificationUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Ocean Life'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
            <p>Thank you for registering with us. Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #666; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        Thank you for registering with us. Please verify your email address to complete your registration.
        
        Click the following link to verify your email:
        ${verificationLink}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully');
    console.log('   To:', email);
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    console.error('   Full error:', error);
    if (error.response) {
      console.error('   SMTP Response:', error.response);
    }
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} resetToken - Password reset token
 * @param {string} storeSubdomain - Store subdomain (optional, for multi-tenant)
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendPasswordResetEmail = async (email, name, resetToken, storeSubdomain = null) => {
  try {
    // Get base URL from environment or use default
    let baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Parse baseUrl to extract components
    let baseUrlObj;
    try {
      baseUrlObj = new URL(baseUrl);
    } catch (e) {
      // If baseUrl is not a valid URL, construct it
      baseUrlObj = new URL('http://localhost:3000');
    }
    
    // Use protocol from baseUrl, or default based on NODE_ENV
    const protocol = baseUrlObj.protocol.replace(':', '') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    
    // If store subdomain is provided, construct store subdomain URL
    let resetUrl = '';
    if (storeSubdomain) {
      const port = baseUrlObj.port ? `:${baseUrlObj.port}` : '';
      // Handle localhost subdomains
      if (baseUrlObj.hostname.includes('localhost') || baseUrlObj.hostname === 'localhost') {
        resetUrl = `${protocol}://${storeSubdomain}.localhost${port}`;
      } else if (baseUrlObj.hostname.includes('.myapp.local')) {
        resetUrl = `${protocol}://${storeSubdomain}.myapp.local${port}`;
      } else {
        // For production, construct subdomain URL
        const parts = baseUrlObj.hostname.split('.');
        const baseDomain = parts.slice(-2).join('.');
        resetUrl = `${protocol}://${storeSubdomain}.${baseDomain}${port}`;
      }
    } else {
      resetUrl = baseUrl;
    }
    
    const resetLink = `${resetUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Ocean Life'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        You requested to reset your password. Click the following link to reset it:
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export default transporter;

