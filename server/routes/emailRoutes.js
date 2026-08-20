import express from 'express';
import { storage } from '../config/storage.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();
router.use(requireAdmin);

// 1. Get Live Transactional Email Logs
router.get('/logs', (req, res) => {
  try {
    const emails = storage.getEmails();
    res.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (err) {
    console.error('Error getting email logs:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve email logs.' });
  }
});

// 2. Get Single Email Details
router.get('/:id', (req, res) => {
  try {
    const email = storage.getEmails().find((e) => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }
    res.json({ success: true, email });
  } catch (err) {
    console.error('Error retrieving email:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch email.' });
  }
});

// 3. Trigger manual test email
router.post('/test', async (req, res) => {
  try {
    const { to, subject, message, recipientName } = req.body;
    const sent = await sendEmail({
      to: to || 'test@example.com',
      subject: subject || 'WorkerConnect Platform Test Alert',
      type: 'test_notification',
      recipientName: recipientName || 'Valued User',
      templateData: { message: message || 'This is a test notification from the WorkerConnect engine.' },
    });
    res.json({ success: true, message: 'Email sent & logged', email: sent });
  } catch (err) {
    console.error('Error triggering test email:', err);
    res.status(500).json({ success: false, message: 'Failed to send test email.' });
  }
});

export default router;
