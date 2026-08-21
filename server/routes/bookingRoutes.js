import express from 'express';
import { storage } from '../config/storage.js';
import { authenticateToken, requireCustomer, requireWorker } from '../middleware/authMiddleware.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

function getIO(req) {
  return req.app.get('io');
}

// 1. Customer Creates Booking Request
router.post('/', requireCustomer, async (req, res) => {
  try {
    const customerId = req.user.id;
    const customer = storage.findCustomerById(customerId);
    const {
      workerId,
      workType,
      serviceAddress,
      location,
      preferredDate,
      preferredTime,
      description,
      customerName,
      customerMobile,
    } = req.body;

    if (!workerId || !workType || !serviceAddress || !preferredDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking details.' });
    }

    const worker = storage.findWorkerById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found or no longer available.' });
    }

    if (worker.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This worker is currently not active for bookings.' });
    }

    const newBooking = {
      id: 'bk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      customerId,
      customerName: customerName || customer.fullName,
      customerEmail: customer.email,
      customerMobile: customerMobile || customer.mobile,
      workerId: worker.id,
      workerName: worker.fullName,
      workerSkill: worker.skill,
      workerAvatar: worker.avatar,
      workType,
      serviceAddress,
      location: location || worker.location,
      preferredDate,
      preferredTime: preferredTime || 'Flexible / Morning',
      description: description || '',
      status: 'pending', // pending, accepted, rejected, completed, cancelled
      estimatedPrice: worker.servicePrice,
      createdAt: new Date().toISOString(),
    };

    storage.createBooking(newBooking);

    // Send Email to Worker
    sendEmail({
      to: worker.email,
      subject: `WorkerConnect: New Service Request from ${newBooking.customerName}`,
      type: 'booking_created_worker',
      recipientName: worker.fullName,
      templateData: {
        customerName: newBooking.customerName,
        customerMobile: newBooking.customerMobile,
        workType: newBooking.workType,
        serviceAddress: newBooking.serviceAddress,
        preferredDate: newBooking.preferredDate,
        preferredTime: newBooking.preferredTime,
        description: newBooking.description,
      },
    });

    // Send Email to Customer
    sendEmail({
      to: customer.email,
      subject: `WorkerConnect: Booking Request Sent to ${worker.fullName}`,
      type: 'booking_created_customer',
      recipientName: newBooking.customerName,
      templateData: {
        bookingId: newBooking.id,
        workerName: worker.fullName,
        workerSkill: worker.skill,
        workType: newBooking.workType,
        preferredDate: newBooking.preferredDate,
        preferredTime: newBooking.preferredTime,
      },
    });

    // Real-time socket broadcast / alert to worker
    const io = getIO(req);
    if (io) {
      io.to(`worker_${worker.id}`).emit('new_booking_notification', newBooking);
      io.emit('global_activity', {
        type: 'new_booking',
        message: `${newBooking.customerName} requested ${worker.skill} service from ${worker.fullName}`,
        time: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking request sent to worker! Status: Pending.',
      booking: newBooking,
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Failed to create booking request.' });
  }
});

// Start a customer-worker conversation before creating a booking
router.post('/inquiries', requireCustomer, (req, res) => {
  const customer = storage.findCustomerById(req.user.id);
  const worker = storage.findWorkerById(req.body.workerId);

  if (!worker || worker.status !== 'approved') {
    return res.status(404).json({ success: false, message: 'Worker is not available for chat.' });
  }

  let inquiry = storage.findInquiryBetween(customer.id, worker.id);
  if (!inquiry) {
    inquiry = storage.createInquiry({
      id: 'inq_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      customerId: customer.id,
      customerName: customer.fullName,
      workerId: worker.id,
      workerName: worker.fullName,
      workerSkill: worker.skill,
      workerAvatar: worker.avatar,
      workType: `${worker.skill} inquiry`,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({ success: true, inquiry });
});

router.get('/inquiries/worker', requireWorker, (req, res) => {
  res.json({ success: true, inquiries: storage.findInquiriesByWorker(req.user.id) });
});

router.get('/inquiries/:id/messages', authenticateToken, (req, res) => {
  const inquiry = storage.findInquiryById(req.params.id);
  if (!inquiry) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  if (req.user.id !== inquiry.customerId && req.user.id !== inquiry.workerId) {
    return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
  }
  res.json({ success: true, messages: storage.getMessagesByBooking(inquiry.id) });
});

router.post('/inquiries/:id/messages', authenticateToken, (req, res) => {
  const inquiry = storage.findInquiryById(req.params.id);
  const text = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!inquiry) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  if (req.user.id !== inquiry.customerId && req.user.id !== inquiry.workerId) {
    return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
  }
  if (!text) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
  if (text.length > 2000) return res.status(400).json({ success: false, message: 'Message cannot exceed 2000 characters.' });

  const message = storage.createMessage({
    id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    inquiryId: inquiry.id,
    senderId: req.user.id,
    senderRole: req.user.role,
    senderName: req.user.fullName,
    message: text,
    createdAt: new Date().toISOString(),
  });
  const io = getIO(req);
  if (io) {
    io.to(`inquiry_${inquiry.id}`).emit('booking_chat_message', message);
    io.to(req.user.role === 'customer' ? `worker_${inquiry.workerId}` : `customer_${inquiry.customerId}`).emit(
      'booking_chat_notification', { bookingId: inquiry.id, senderName: message.senderName, message: message.message }
    );
  }
  res.status(201).json({ success: true, message });
});

// 2. Customer Bookings List
router.get('/customer', requireCustomer, (req, res) => {
  try {
    const customerId = req.user.id;
    const bookings = storage.findBookingsByCustomer(customerId);
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Error fetching customer bookings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// 3. Worker Bookings List
router.get('/worker', requireWorker, (req, res) => {
  try {
    const workerId = req.user.id;
    const bookings = storage.findBookingsByWorker(workerId);
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Error fetching worker bookings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// 4. Booking Chat History
router.get('/:id/messages', authenticateToken, (req, res) => {
  try {
    const booking = storage.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.id !== booking.customerId && req.user.id !== booking.workerId) {
      return res.status(403).json({ success: false, message: 'You are not part of this booking.' });
    }

    res.json({ success: true, messages: storage.getMessagesByBooking(booking.id) });
  } catch (err) {
    console.error('Error fetching booking messages:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve chat messages.' });
  }
});

// 5. Send Booking Chat Message
router.post('/:id/messages', authenticateToken, (req, res) => {
  try {
    const booking = storage.findBookingById(req.params.id);
    const text = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.id !== booking.customerId && req.user.id !== booking.workerId) {
      return res.status(403).json({ success: false, message: 'You are not part of this booking.' });
    }

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    if (text.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message cannot exceed 2000 characters.' });
    }

    const message = storage.createMessage({
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      bookingId: booking.id,
      senderId: req.user.id,
      senderRole: req.user.role,
      senderName: req.user.fullName,
      message: text,
      createdAt: new Date().toISOString(),
    });

    const io = getIO(req);
    if (io) {
      io.to(`booking_${booking.id}`).emit('booking_chat_message', message);
      io.to(req.user.role === 'customer' ? `worker_${booking.workerId}` : `customer_${booking.customerId}`).emit(
        'booking_chat_notification',
        { bookingId: booking.id, senderName: message.senderName, message: message.message }
      );
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('Error sending booking message:', err);
    res.status(500).json({ success: false, message: 'Failed to send chat message.' });
  }
});

// 6. Worker Accepts Booking Request
router.put('/:id/accept', requireWorker, async (req, res) => {
  try {
    const workerId = req.user.id;
    const booking = storage.findBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    if (booking.workerId !== workerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to manage this booking.' });
    }

    const worker = storage.findWorkerById(workerId);
    const updated = storage.updateBooking(booking.id, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    });

    // Send Email to Customer: "Your booking request has been accepted."
    sendEmail({
      to: booking.customerEmail,
      subject: `Your booking request has been accepted by ${worker.fullName}!`,
      type: 'booking_accepted',
      recipientName: booking.customerName,
      templateData: {
        workerName: worker.fullName,
        workerSkill: worker.skill,
        workerMobile: worker.mobile,
        serviceAddress: booking.serviceAddress,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
      },
    });

    // Socket alert to customer
    const io = getIO(req);
    if (io) {
      io.to(`customer_${booking.customerId}`).emit('booking_status_updated', {
        bookingId: booking.id,
        status: 'accepted',
        workerName: worker.fullName,
        message: 'Your booking request has been accepted!',
      });
      io.emit('booking_status_change', updated);
    }

    res.json({
      success: true,
      message: 'Booking request accepted successfully. Customer notified!',
      booking: updated,
    });
  } catch (err) {
    console.error('Error accepting booking:', err);
    res.status(500).json({ success: false, message: 'Failed to accept booking.' });
  }
});

// 5. Worker Rejects Booking Request
router.put('/:id/reject', requireWorker, async (req, res) => {
  try {
    const workerId = req.user.id;
    const { reason } = req.body;
    const booking = storage.findBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    if (booking.workerId !== workerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to manage this booking.' });
    }

    const worker = storage.findWorkerById(workerId);
    const updated = storage.updateBooking(booking.id, {
      status: 'rejected',
      rejectReason: reason || 'Worker unavailable for this slot',
      rejectedAt: new Date().toISOString(),
    });

    // Send Email to Customer: "Your booking request has been rejected."
    sendEmail({
      to: booking.customerEmail,
      subject: `Your booking request with ${worker.fullName} could not be accepted`,
      type: 'booking_rejected',
      recipientName: booking.customerName,
      templateData: {
        workerName: worker.fullName,
        workerSkill: worker.skill,
        reason: reason || 'Schedule clash / Slot unavailable',
      },
    });

    // Socket alert to customer
    const io = getIO(req);
    if (io) {
      io.to(`customer_${booking.customerId}`).emit('booking_status_updated', {
        bookingId: booking.id,
        status: 'rejected',
        workerName: worker.fullName,
        message: 'Your booking request has been rejected.',
      });
      io.emit('booking_status_change', updated);
    }

    res.json({
      success: true,
      message: 'Booking request rejected. Customer notified.',
      booking: updated,
    });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ success: false, message: 'Failed to reject booking.' });
  }
});

// 6. Complete Job (Worker or Customer)
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const booking = storage.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Allow worker or customer of this booking, or admin
    if (
      req.user.id !== booking.workerId &&
      req.user.id !== booking.customerId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updated = storage.updateBooking(booking.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    // Increment worker completed jobs count
    const worker = storage.findWorkerById(booking.workerId);
    if (worker) {
      storage.updateWorker(worker.id, {
        completedJobs: (worker.completedJobs || 0) + 1,
      });
    }

    // Send Completed Email to Customer with rating prompt
    sendEmail({
      to: booking.customerEmail,
      subject: `Service Completed! Please rate your experience with ${booking.workerName}`,
      type: 'booking_completed',
      recipientName: booking.customerName,
      templateData: {
        workerName: booking.workerName,
        workType: booking.workType,
      },
    });

    const io = getIO(req);
    if (io) {
      io.emit('booking_status_change', updated);
    }

    res.json({
      success: true,
      message: 'Job marked as Completed! Rating option is now available to customer.',
      booking: updated,
    });
  } catch (err) {
    console.error('Error completing booking:', err);
    res.status(500).json({ success: false, message: 'Failed to mark job as complete.' });
  }
});

// 7. Customer Cancels Booking (if pending)
router.put('/:id/cancel', requireCustomer, (req, res) => {
  try {
    const customerId = req.user.id;
    const booking = storage.findBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.customerId !== customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updated = storage.updateBooking(booking.id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    const io = getIO(req);
    if (io) {
      io.to(`worker_${booking.workerId}`).emit('booking_status_updated', {
        bookingId: booking.id,
        status: 'cancelled',
        message: 'Customer cancelled the booking request.',
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking: updated,
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
});

// 8. Rating & Review System (Customer rates completed job)
router.post('/:id/review', requireCustomer, (req, res) => {
  try {
    const customerId = req.user.id;
    const { rating, comment } = req.body;
    const booking = storage.findBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.customerId !== customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Review can only be submitted after service completion.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Star rating must be between 1 and 5.' });
    }

    const reviewObj = {
      id: 'rev_' + Date.now().toString(36),
      bookingId: booking.id,
      workerId: booking.workerId,
      customerId,
      customerName: booking.customerName,
      rating: Number(rating),
      comment: comment ? comment.trim() : 'Great professional service!',
      date: new Date().toISOString(),
    };

    storage.createReview(reviewObj);

    // Update booking with review reference
    const updatedBooking = storage.updateBooking(booking.id, {
      review: reviewObj,
    });

    const worker = storage.findWorkerById(booking.workerId);

    res.json({
      success: true,
      message: 'Review submitted successfully! Worker rating updated.',
      review: reviewObj,
      updatedWorkerRating: worker ? worker.rating : null,
      booking: updatedBooking,
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

export default router;
