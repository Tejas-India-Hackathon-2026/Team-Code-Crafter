import nodemailer from 'nodemailer';
import { storage } from '../config/storage.js';

// Optional real transporter if SMTP environment variables are supplied
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getEmailBaseLayout(title, contentHtml) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
      .header { background: #00D4D4; padding: 24px 30px; text-align: center; color: #042f2e; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
      .body { padding: 30px; line-height: 1.6; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .badge-success { background: #dcfce7; color: #15803d; }
      .badge-warning { background: #fef3c7; color: #b45309; }
      .badge-danger { background: #fee2e2; color: #b91c1c; }
      .badge-aqua { background: #ccfbfb; color: #087e7e; }
      .btn { display: inline-block; background-color: #00D4D4; color: #042f2e; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; margin-top: 20px; text-align: center; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚡ WorkerConnect</h1>
        <p>Nearby Skilled Worker Booking Platform</p>
      </div>
      <div class="body">
        <h2 style="margin-top:0; color:#0f172a; font-size:20px;">${title}</h2>
        ${contentHtml}
      </div>
      <div class="footer">
        <p>© 2025 WorkerConnect Platform. Connecting homes with verified professionals.</p>
        <p>Need support? Contact us at support@workerconnect.com</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

export async function sendEmail({ to, subject, type, recipientName, templateData }) {
  let html = '';
  let previewText = '';

  switch (type) {
    case 'worker_registered':
      previewText = `Welcome to WorkerConnect, ${recipientName}! Your profile is pending verification.`;
      html = getEmailBaseLayout(
        'Application Received – Pending Verification',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Thank you for signing up as a skilled worker on <strong>WorkerConnect</strong>!</p>
        <div class="card">
          <p><strong>Skill Category:</strong> <span class="badge badge-aqua">${templateData.skill}</span></p>
          <p><strong>Experience:</strong> ${templateData.experience} Years</p>
          <p><strong>Location:</strong> ${templateData.location}</p>
          <p><strong>Status:</strong> <span class="badge badge-warning">Pending Verification</span></p>
        </div>
        <p>Our admin team is reviewing your details and uploaded ID proof. Once approved, your profile will be published and nearby customers will be able to book your services.</p>
        <p>We will notify you by email as soon as verification is complete!</p>
        `
      );
      break;

    case 'worker_approved':
      previewText = `Congratulations ${recipientName}! Your WorkerConnect profile has been approved.`;
      html = getEmailBaseLayout(
        'Congratulations! Profile Approved 🚀',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Great news! Your skilled worker profile on <strong>WorkerConnect</strong> has been <span class="badge badge-success">Approved</span> by our verification team.</p>
        <div class="card">
          <p><strong>Status:</strong> <span class="badge badge-success">Verified & Active</span></p>
          <p>Your profile is now live! Customers searching in your area can now send you direct service booking requests.</p>
        </div>
        <p>Make sure to keep your dashboard open or notifications enabled to respond quickly to new job requests.</p>
        `
      );
      break;

    case 'worker_rejected':
      previewText = `WorkerConnect Verification Update for ${recipientName}.`;
      html = getEmailBaseLayout(
        'Worker Application Status Update',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>We reviewed your recent worker application on WorkerConnect. Unfortunately, your application could not be approved at this time.</p>
        <div class="card">
          <p><strong>Reason:</strong> ${templateData.reason || 'Verification details were incomplete or did not meet platform safety requirements.'}</p>
        </div>
        <p>If you believe this was an error, you may reply to this email or re-register with updated documents.</p>
        `
      );
      break;

    case 'customer_registered':
      previewText = `Welcome to WorkerConnect, ${recipientName}!`;
      html = getEmailBaseLayout(
        'Welcome to WorkerConnect!',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Thank you for creating an account on WorkerConnect. You can now effortlessly discover and book trusted local electricians, plumbers, painters, carpenters, AC technicians, and more with instant updates.</p>
        `
      );
      break;

    case 'booking_created_worker':
      previewText = `New Job Request from ${templateData.customerName} for ${templateData.workType}!`;
      html = getEmailBaseLayout(
        '🔔 New Booking Request Received!',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>You have received a new service booking request:</p>
        <div class="card">
          <p><strong>Customer:</strong> ${templateData.customerName} (${templateData.customerMobile})</p>
          <p><strong>Work Type:</strong> ${templateData.workType}</p>
          <p><strong>Date & Time:</strong> ${templateData.preferredDate} at ${templateData.preferredTime}</p>
          <p><strong>Service Address:</strong> ${templateData.serviceAddress}</p>
          <p><strong>Customer Notes:</strong> ${templateData.description || 'N/A'}</p>
        </div>
        <p>Please log in to your Worker Dashboard to <strong>Accept</strong> or <strong>Reject</strong> this request promptly.</p>
        `
      );
      break;

    case 'booking_created_customer':
      previewText = `Your booking request with ${templateData.workerName} has been sent.`;
      html = getEmailBaseLayout(
        'Booking Request Submitted',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Your booking request for <strong>${templateData.workType}</strong> has been sent to <strong>${templateData.workerName}</strong> (${templateData.workerSkill}).</p>
        <div class="card">
          <p><strong>Booking ID:</strong> #${templateData.bookingId}</p>
          <p><strong>Scheduled Date:</strong> ${templateData.preferredDate} (${templateData.preferredTime})</p>
          <p><strong>Status:</strong> <span class="badge badge-warning">Pending Worker Response</span></p>
        </div>
        <p>You will receive an instant notification as soon as the worker accepts your request.</p>
        `
      );
      break;

    case 'booking_accepted':
      previewText = `Good news! Your booking request has been accepted by ${templateData.workerName}.`;
      html = getEmailBaseLayout(
        'Your Booking Request Has Been Accepted! 🎉',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p><strong>Your booking request has been accepted.</strong></p>
        <div class="card">
          <p><strong>Worker:</strong> ${templateData.workerName} (${templateData.workerSkill})</p>
          <p><strong>Worker Contact:</strong> ${templateData.workerMobile}</p>
          <p><strong>Scheduled Date:</strong> ${templateData.preferredDate} at ${templateData.preferredTime}</p>
          <p><strong>Service Location:</strong> ${templateData.serviceAddress}</p>
          <p><strong>Status:</strong> <span class="badge badge-success">Accepted & Confirmed</span></p>
        </div>
        <p>The worker will arrive at the scheduled time. You can reach out directly via their contact number above if you need to coordinate.</p>
        `
      );
      break;

    case 'booking_rejected':
      previewText = `Your booking request was rejected by ${templateData.workerName}.`;
      html = getEmailBaseLayout(
        'Your Booking Request Has Been Rejected',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p><strong>Your booking request has been rejected.</strong></p>
        <div class="card">
          <p><strong>Worker:</strong> ${templateData.workerName} (${templateData.workerSkill})</p>
          <p><strong>Reason:</strong> ${templateData.reason || 'Worker is currently unavailable at this requested time slot.'}</p>
        </div>
        <p>Don't worry! You can easily explore and book other verified skilled workers nearby on WorkerConnect.</p>
        `
      );
      break;

    case 'booking_completed':
      previewText = `Your service with ${templateData.workerName} is completed. Please rate your experience!`;
      html = getEmailBaseLayout(
        'Service Completed – Please Rate Your Experience ⭐',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Your booking for <strong>${templateData.workType}</strong> with <strong>${templateData.workerName}</strong> has been marked as <span class="badge badge-success">Completed</span>.</p>
        <p>We hope you had a great experience! Please take 10 seconds to submit a star rating and review to help other neighbors in your community.</p>
        `
      );
      break;

    case 'password_reset':
      previewText = `WorkerConnect Password Reset Request`;
      html = getEmailBaseLayout(
        'Password Reset Request',
        `
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>We received a request to reset your password for WorkerConnect.</p>
        <div class="card">
          <p><strong>Temporary Reset Code / Link:</strong></p>
          <p style="font-size:24px; font-weight:bold; letter-spacing:4px; color:#00b5b5;">${templateData.resetCode || 'WC-88421'}</p>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        `
      );
      break;

    default:
      previewText = `WorkerConnect Notification`;
      html = getEmailBaseLayout('WorkerConnect Notification', `<p>${templateData.message || 'Notification'}</p>`);
  }

  // Log email to memory & JSON persistence
  const logEntry = storage.logEmail({
    to,
    subject,
    type,
    recipientName,
    previewText,
    html,
  });

  // Attempt real delivery if SMTP is configured
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"WorkerConnect" <${process.env.SMTP_FROM || 'no-reply@workerconnect.com'}>`,
        to,
        subject,
        html,
      });
      console.log(`✉️ Email dispatched to ${to} via SMTP`);
    } catch (err) {
      console.error(`Failed to send real email to ${to}:`, err.message);
    }
  } else {
    console.log(`✉️ [In-App Email Engine] Logged & Queued email to ${to}: "${subject}"`);
  }

  return logEntry;
}
