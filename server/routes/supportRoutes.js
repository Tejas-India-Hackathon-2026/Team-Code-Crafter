import express from 'express';
import { storage } from '../config/storage.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

router.post('/complaints', authenticateToken, (req, res) => {
  try {
    const { bookingId, description, attachment } = req.body;
    const cleanBookingId = typeof bookingId === 'string' ? bookingId.trim() : '';
    const cleanDescription = typeof description === 'string' ? description.trim() : '';

    if (!cleanBookingId || !cleanDescription) {
      return res.status(400).json({ success: false, message: 'Booking ID and problem description are required.' });
    }
    if (cleanDescription.length > 5000) {
      return res.status(400).json({ success: false, message: 'Description cannot exceed 5000 characters.' });
    }

    const booking = storage.findBookingById(cleanBookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found. Please check the booking ID.' });
    }
    if (req.user.role !== 'admin' && req.user.id !== booking.customerId && req.user.id !== booking.workerId) {
      return res.status(403).json({ success: false, message: 'You can only report a booking you are part of.' });
    }

    let safeAttachment = null;
    if (attachment) {
      if (typeof attachment.data !== 'string' || !attachment.data.startsWith('data:')) {
        return res.status(400).json({ success: false, message: 'Invalid attachment.' });
      }
      const base64 = attachment.data.split(',')[1] || '';
      const bytes = Math.floor((base64.length * 3) / 4);
      if (bytes > MAX_ATTACHMENT_BYTES) {
        return res.status(400).json({ success: false, message: 'Attachment must be 2MB or smaller.' });
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(attachment.type)) {
        return res.status(400).json({ success: false, message: 'Only PDF, JPG, PNG, or WEBP files are accepted.' });
      }
      safeAttachment = {
        name: String(attachment.name || 'attachment').slice(0, 120),
        type: attachment.type,
        data: attachment.data,
      };
    }

    const complaint = storage.createComplaint({
      id: 'cmp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      bookingId: booking.id,
      reporterId: req.user.id,
      reporterName: req.user.fullName,
      reporterRole: req.user.role,
      description: cleanDescription,
      attachment: safeAttachment,
      status: 'open',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. Our support team will review it.',
      complaint: { id: complaint.id, bookingId: complaint.bookingId, status: complaint.status, createdAt: complaint.createdAt },
    });
  } catch (err) {
    console.error('Complaint submission error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit complaint.' });
  }
});

router.get('/complaints', requireAdmin, (req, res) => {
  res.json({ success: true, count: storage.getComplaints().length, complaints: storage.getComplaints() });
});

export default router;
