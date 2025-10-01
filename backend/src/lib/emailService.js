import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });
};

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send email change verification email
export const sendEmailChangeVerification = async (email, fullName, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    // Create verification URL for email change
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email-change/${verificationToken}`;
    
    // Email template for email change verification (matching purchase email style)
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Email Change Verification - AgroLink</title>
        </head>
        <body style="font-family:Segoe UI,Tahoma,Arial,sans-serif;background:#f9fafb;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#111827;color:#ffffff;padding:20px 24px;">
              <div style="font-size:20px;font-weight:700;">AgroLink</div>
              <div style="margin-top:6px;font-size:14px;opacity:.9;">Email change verification required</div>
            </div>

            <div style="padding:24px;">
              <div style="font-size:18px;font-weight:600;color:#111827;">Hi ${fullName},</div>
              <div style="margin-top:8px;color:#374151;">You have requested to change your email address. Please verify your new email address to complete this change:</div>

              <div style="margin-top:16px;color:#374151;font-size:14px;">
                <div><strong>New Email</strong> ${email}</div>
                <div><strong>Requested</strong> ${new Date().toLocaleString()}</div>
              </div>

              <div style="margin-top:20px;">
                <a href="${verificationUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">Verify Email Change</a>
              </div>

              <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px;">
                <div style="background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid #111827;">
                  <div style="font-weight:600;color:#111827;margin-bottom:8px;">🛡️ Security Information</div>
                  <div style="color:#374151;font-size:14px;margin-bottom:6px;">• This verification link will expire in 24 hours</div>
                  <div style="color:#374151;font-size:14px;margin-bottom:6px;">• Your current email remains active until verification</div>
                  <div style="color:#374151;font-size:14px;">• If you didn't request this change, please ignore this email</div>
                </div>
              </div>

              <div style="margin-top:16px;color:#6b7280;font-size:12px;">
                <div>If the button doesn't work, copy and paste this link:</div>
                <div style="background:#f3f4f6;padding:8px;border-radius:4px;margin-top:4px;font-family:monospace;word-break:break-all;">${verificationUrl}</div>
              </div>
            </div>

            <div style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} AgroLink. This is an automated message; please do not reply.
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"AgroLink Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Verify Your Email Change - AgroLink',
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email change verification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email change verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email
export const sendVerificationEmail = async (email, fullName, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    
    // Email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - AgroLink</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background-color: #f7fafc;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            }
            .logo-container {
              position: relative;
              z-index: 1;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background-color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .logo img {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              position: relative;
              z-index: 1;
            }
            .header h2 {
              font-size: 18px;
              font-weight: 400;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 24px;
              font-weight: 600;
              color: #1a202c;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 40px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
            }
            .link-container {
              background-color: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .link-container p {
              font-size: 14px;
              color: #718096;
              margin-bottom: 10px;
            }
            .link {
              word-break: break-all;
              background-color: #edf2f7;
              padding: 12px;
              border-radius: 6px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #2d3748;
            }
            .warning {
              background-color: #fef5e7;
              border-left: 4px solid #f6ad55;
              padding: 16px;
              margin: 30px 0;
              border-radius: 0 6px 6px 0;
            }
            .warning p {
              color: #744210;
              font-weight: 500;
              margin: 0;
            }
            .footer {
              background-color: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #718096;
              font-size: 14px;
              margin: 5px 0;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              color: #10b981;
              text-decoration: none;
              font-weight: 500;
            }
            @media (max-width: 600px) {
              .email-container {
                margin: 0;
                border-radius: 0;
              }
              .header, .content, .footer {
                padding: 30px 20px;
              }
              .button {
                padding: 14px 30px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                  <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/agrolink-logo.png" alt="AgroLink Logo" />
                </div>
                <h1>AgroLink</h1>
                <h2>Email Verification Required</h2>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${fullName || 'there'}! 👋</div>
              
              <div class="message">
                <p>Welcome to AgroLink! We're excited to have you join our agricultural community.</p>
                <p>To complete your registration and start exploring our marketplace, please verify your email address by clicking the button below:</p>
              </div>
              
              <div class="button-container">
                <a href="${verificationUrl}" class="button">Verify My Email Address</a>
              </div>
              
              <div class="link-container">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <div class="link">${verificationUrl}</div>
              </div>
              
              <div class="warning">
                <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              </div>
              
              <div class="message">
                <p>If you didn't create an account with AgroLink, please ignore this email. Your account will not be activated without verification.</p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>AgroLink</strong> - Connecting Farmers and Buyers</p>
              <div class="social-links">
                <a href="#">Website</a>
                <a href="#">Support</a>
                <a href="#">Privacy Policy</a>
              </div>
              <p>© 2024 AgroLink. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textTemplate = `
      Hello ${fullName || 'there'}!
      
      Thank you for registering with AgroLink. To complete your registration, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours for security reasons.
      
      If you didn't create an account with AgroLink, please ignore this email.
      
      © 2024 AgroLink. All rights reserved.
    `;

    const mailOptions = {
      from: `"AgroLink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - AgroLink Registration',
      text: textTemplate,
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    // Email sent successfully
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email (for future use)
export const sendPasswordResetEmail = async (email, fullName, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - AgroLink</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background-color: #f7fafc;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            }
            .logo-container {
              position: relative;
              z-index: 1;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background-color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .logo img {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              position: relative;
              z-index: 1;
            }
            .header h2 {
              font-size: 18px;
              font-weight: 400;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 24px;
              font-weight: 600;
              color: #1a202c;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 40px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
            }
            .link-container {
              background-color: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .link-container p {
              font-size: 14px;
              color: #718096;
              margin-bottom: 10px;
            }
            .link {
              word-break: break-all;
              background-color: #edf2f7;
              padding: 12px;
              border-radius: 6px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #2d3748;
            }
            .warning {
              background-color: #fef2f2;
              border-left: 4px solid #fca5a5;
              padding: 16px;
              margin: 30px 0;
              border-radius: 0 6px 6px 0;
            }
            .warning p {
              color: #991b1b;
              font-weight: 500;
              margin: 0;
            }
            .footer {
              background-color: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #718096;
              font-size: 14px;
              margin: 5px 0;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              color: #ef4444;
              text-decoration: none;
              font-weight: 500;
            }
            @media (max-width: 600px) {
              .email-container {
                margin: 0;
                border-radius: 0;
              }
              .header, .content, .footer {
                padding: 30px 20px;
              }
              .button {
                padding: 14px 30px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                  <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/agrolink-logo.png" alt="AgroLink Logo" />
                </div>
                <h1>AgroLink</h1>
                <h2>Password Reset Request</h2>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${fullName || 'there'}! 🔐</div>
              
              <div class="message">
                <p>We received a request to reset your password for your AgroLink account.</p>
                <p>Click the button below to create a new password:</p>
              </div>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <div class="link-container">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <div class="link">${resetUrl}</div>
              </div>
              
              <div class="warning">
                <p><strong>⏰ Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
              </div>
              
              <div class="message">
                <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>AgroLink</strong> - Connecting Farmers and Buyers</p>
              <div class="social-links">
                <a href="#">Website</a>
                <a href="#">Support</a>
                <a href="#">Privacy Policy</a>
              </div>
              <p>© 2024 AgroLink. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"AgroLink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - AgroLink',
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    // Password reset email sent successfully
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  generateVerificationToken,
};

export const sendBudgetAlertEmail = async ({ to, budgetName, period, amount, spent, utilization }) => {
  try {
    const transporter = createTransporter();
    const percent = Math.round((utilization || 0) * 100);
    const subject = `Budget alert: ${budgetName} at ${percent}% (${period.toLowerCase()})`;
    const html = `
      <!DOCTYPE html>
      <html><body style="font-family:Segoe UI,Tahoma,Arial,sans-serif;background:#f9fafb;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:#dc2626;color:#ffffff;padding:16px 20px;font-weight:700;">AgroLink • Budget Alert</div>
          <div style="padding:20px;color:#111827;">
            <div style="font-size:16px;margin-bottom:8px;">Budget <strong>${budgetName}</strong> is at <strong>${percent}%</strong> utilization.</div>
            <div style="color:#374151;font-size:14px;">Period: ${period}</div>
            <div style="color:#374151;font-size:14px;">Limit: LKR ${Number(amount||0).toLocaleString()}</div>
            <div style="color:#374151;font-size:14px;">Spent: LKR ${Number(spent||0).toLocaleString()}</div>
          </div>
        </div>
      </body></html>`;
    await transporter.sendMail({ from: `"AgroLink" <${process.env.EMAIL_USER}>`, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Error sending budget alert email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email covering pickup/delivery and cash/card flows
export const sendOrderPlacedEmail = async (order, recipient) => {
  try {
    const transporter = createTransporter();

    const customerName = recipient?.fullName || order.contactName || 'Customer';
    const customerEmail = recipient?.email || order.contactEmail;
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const isDelivery = order.deliveryType === 'DELIVERY';
    const isCard = order.paymentMethod === 'CARD';

    const statusLine = isCard ? 'Payment received' : 'Cash payment on ' + (isDelivery ? 'delivery' : 'pickup');
    const methodLine = `${order.deliveryType} • ${order.paymentMethod}`;

    const subject = `Your order ${order.orderNumber || order._id} is confirmed (${order.deliveryType.toLowerCase()})`;

    const itemsRows = (order.items || [])
      .map(
        (it) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${it.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${it.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">LKR ${(it.price * it.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const deliveryBlock = isDelivery
      ? `
        <div style="margin-top:16px;color:#374151;font-size:14px;">
          <div style="font-weight:600;margin-bottom:6px;">Delivery Address</div>
          <div>${order.deliveryAddress?.line1 || ''}</div>
          ${order.deliveryAddress?.line2 ? `<div>${order.deliveryAddress.line2}</div>` : ''}
          <div>${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} ${order.deliveryAddress?.postalCode || ''}</div>
          <div style="margin-top:8px;">We will notify you as your delivery progresses.</div>
        </div>`
      : `
        <div style="margin-top:16px;color:#374151;font-size:14px;">
          <div>We will notify you when your order is ready for pickup.</div>
        </div>`;

    const payHelp = isCard
      ? ''
      : '<div style="margin-top:8px;color:#6b7280;">Please prepare exact cash to speed up the handover.</div>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Order Confirmation - AgroLink</title>
        </head>
        <body style="font-family:Segoe UI,Tahoma,Arial,sans-serif;background:#f9fafb;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#111827;color:#ffffff;padding:20px 24px;">
              <div style="font-size:20px;font-weight:700;">AgroLink</div>
              <div style="margin-top:6px;font-size:14px;opacity:.9;">${statusLine}</div>
            </div>

            <div style="padding:24px;">
              <div style="font-size:18px;font-weight:600;color:#111827;">Hi ${customerName},</div>
              <div style="margin-top:8px;color:#374151;">Thanks for your order! Here are the details:</div>

              <div style="margin-top:16px;color:#374151;font-size:14px;">
                <div><strong>Order #</strong> ${order.orderNumber || order._id}</div>
                <div><strong>Method</strong> ${methodLine}</div>
                <div><strong>Date</strong> ${new Date(order.createdAt || Date.now()).toLocaleString()}</div>
              </div>

              ${deliveryBlock}
              ${payHelp}

              <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111827;">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;">Item</th>
                      <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;">Qty</th>
                      <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #e5e7eb;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                    <tr>
                      <td colspan="2" style="padding:8px 12px;text-align:right;color:#6b7280;">Subtotal</td>
                      <td style="padding:8px 12px;text-align:right;">LKR ${Number(order.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:8px 12px;text-align:right;color:#6b7280;">${isDelivery ? 'Shipping' : 'Pickup fee'}</td>
                      <td style="padding:8px 12px;text-align:right;">LKR ${Number(order.deliveryFee || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:12px 12px;text-align:right;font-weight:700;">Order Total</td>
                      <td style="padding:12px 12px;text-align:right;font-weight:700;">LKR ${Number(order.total || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="margin-top:20px;">
                <a href="${siteUrl}/my-orders" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">View my order</a>
              </div>
            </div>

            <div style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} AgroLink. This is an automated message; please do not reply.
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: `"AgroLink" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending order email:', error);
    return { success: false, error: error.message };
  }
};

// Send delivery cancellation email
export const sendDeliveryCancellationEmail = async (delivery, customer) => {
  try {
    const transporter = createTransporter();

    const customerName = customer?.fullName || delivery.contactName || 'Customer';
    const customerEmail = customer?.email || delivery.contactEmail;
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const subject = `Delivery Cancelled - Order ${delivery.order?.orderNumber || delivery._id}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Delivery Cancelled - AgroLink</title>
        </head>
        <body style="font-family:Segoe UI,Tahoma,Arial,sans-serif;background:#f9fafb;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#dc2626;color:#ffffff;padding:20px 24px;">
              <div style="font-size:20px;font-weight:700;">AgroLink</div>
              <div style="margin-top:6px;font-size:14px;opacity:.9;">Delivery Cancelled</div>
            </div>

            <div style="padding:24px;">
              <div style="font-size:18px;font-weight:600;color:#111827;">Hi ${customerName},</div>
              <div style="margin-top:8px;color:#374151;">We regret to inform you that your delivery has been cancelled.</div>

              <div style="margin-top:16px;color:#374151;font-size:14px;">
                <div><strong>Order #</strong> ${delivery.order?.orderNumber || delivery._id}</div>
                <div><strong>Delivery Address</strong> ${delivery.address?.line1 || ''}, ${delivery.address?.city || ''}, ${delivery.address?.state || ''}</div>
                <div><strong>Cancelled On</strong> ${new Date().toLocaleString()}</div>
              </div>

              <div style="margin-top:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;">
                <div style="color:#dc2626;font-weight:600;margin-bottom:8px;">⚠️ Important Information</div>
                <div style="color:#991b1b;font-size:14px;">
                  Your delivery has been cancelled by our logistics team. If you have any questions or concerns, please contact our support team.
                </div>
              </div>

              <div style="margin-top:20px;">
                <a href="${siteUrl}/my-orders" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">View Order Details</a>
              </div>
            </div>

            <div style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} AgroLink. This is an automated message; please do not reply.
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: `"AgroLink" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending delivery cancellation email:', error);
    return { success: false, error: error.message };
  }
};

// Send order cancellation email
export const sendOrderCancellationEmail = async (order, customer) => {
  try {
    const transporter = createTransporter();

    const customerName = customer?.fullName || order.contactName || 'Customer';
    const customerEmail = customer?.email || order.contactEmail;
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const subject = `Order Cancelled - ${order.orderNumber || order._id}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Order Cancelled - AgroLink</title>
        </head>
        <body style="font-family:Segoe UI,Tahoma,Arial,sans-serif;background:#f9fafb;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#dc2626;color:#ffffff;padding:20px 24px;">
              <div style="font-size:20px;font-weight:700;">AgroLink</div>
              <div style="margin-top:6px;font-size:14px;opacity:.9;">Order Cancelled</div>
            </div>

            <div style="padding:24px;">
              <div style="font-size:18px;font-weight:600;color:#111827;">Hi ${customerName},</div>
              <div style="margin-top:8px;color:#374151;">Your order has been successfully cancelled.</div>

              <div style="margin-top:16px;color:#374151;font-size:14px;">
                <div><strong>Order #</strong> ${order.orderNumber || order._id}</div>
                <div><strong>Cancelled On</strong> ${new Date().toLocaleString()}</div>
                <div><strong>Order Total</strong> LKR ${Number(order.total || 0).toFixed(2)}</div>
              </div>

              <div style="margin-top:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;">
                <div style="color:#0369a1;font-weight:600;margin-bottom:8px;">ℹ️ Refund Information</div>
                <div style="color:#0c4a6e;font-size:14px;">
                  If you paid by card, your refund will be processed within 3-5 business days. For cash payments, no refund is needed as payment was not yet collected.
                </div>
              </div>

              <div style="margin-top:20px;">
                <a href="${siteUrl}/my-orders" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">View My Orders</a>
              </div>
            </div>

            <div style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} AgroLink. This is an automated message; please do not reply.
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: `"AgroLink" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending order cancellation email:', error);
    return { success: false, error: error.message };
  }
};

// Named export added to default for convenience in some import styles
export const orderEmails = { sendOrderPlacedEmail, sendDeliveryCancellationEmail, sendOrderCancellationEmail };