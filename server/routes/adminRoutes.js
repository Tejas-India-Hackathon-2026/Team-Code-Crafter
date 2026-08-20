import express from 'express';
import { storage } from '../config/storage.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

function getIO(req) {
  return req.app.get('io');
}

// All admin routes require admin token
router.use(requireAdmin);

// 1. Admin Platform Stats
router.get('/stats', (req, res) => {
  try {
    const workers = storage.getWorkers();
    const customers = storage.getCustomers();
    const bookings = storage.getBookings();

    const pendingWorkers = workers.filter((w) => w.status === 'pending_verification');
    const activeWorkers = workers.filter((w) => w.status === 'approved');
    const suspendedWorkers = workers.filter((w) => w.status === 'suspended');
    const rejectedWorkers = workers.filter((w) => w.status === 'rejected');

    const completedBookings = bookings.filter((b) => b.status === 'completed');
    const activeBookings = bookings.filter((b) => b.status === 'pending' || b.status === 'accepted');

    const totalRevenueVolume = completedBookings.reduce(
      (sum, b) => sum + (Number(b.estimatedPrice) || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        totalWorkers: workers.length,
        totalCustomers: customers.length,
        totalBookings: bookings.length,
        pendingVerifications: pendingWorkers.length,
        activeWorkers: activeWorkers.length,
        suspendedWorkers: suspendedWorkers.length,
        rejectedWorkers: rejectedWorkers.length,
        completedBookingsCount: completedBookings.length,
        activeBookingsCount: activeBookings.length,
        totalRevenueVolume,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute admin statistics.' });
  }
});

// 2. Get Pending Worker Verifications
router.get('/workers/pending', (req, res) => {
  try {
    const pendingWorkers = storage.getWorkers().filter((w) => w.status === 'pending_verification');
    res.json({ success: true, count: pendingWorkers.length, workers: pendingWorkers });
  } catch (err) {
    console.error('Error fetching pending workers:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve pending workers.' });
  }
});

// 3. Worker Verification Action (Approve or Reject)
router.put('/workers/:id/verify', async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    const worker = storage.findWorkerById(req.params.id);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    if (action === 'approve') {
      const updated = storage.updateWorker(worker.id, {
        status: 'approved',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'System Administrator',
      });

      // Send Approval Email to worker
      sendEmail({
        to: worker.email,
        subject: 'WorkerConnect: Your Worker Profile Has Been Approved! 🎉',
        type: 'worker_approved',
        recipientName: worker.fullName,
        templateData: {
          skill: worker.skill,
        },
      });

      // Socket announcement
      const io = getIO(req);
      if (io) {
        io.to(`worker_${worker.id}`).emit('worker_verification_result', {
          status: 'approved',
          message: 'Congratulations! Your profile has been approved and is now public.',
        });
        io.emit('worker_directory_updated', { workerId: worker.id, status: 'approved' });
      }

      return res.json({
        success: true,
        message: `Worker ${worker.fullName} (${worker.skill}) has been Approved! Their profile is now visible to customers.`,
        worker: updated,
      });
    } else if (action === 'reject') {
      const updated = storage.updateWorker(worker.id, {
        status: 'rejected',
        rejectionReason: reason || 'Documentation could not be verified.',
        rejectedAt: new Date().toISOString(),
      });

      // Send Rejection Email to worker
      sendEmail({
        to: worker.email,
        subject: 'WorkerConnect: Update on your Worker Application',
        type: 'worker_rejected',
        recipientName: worker.fullName,
        templateData: {
          reason: reason || 'ID proof or skills details could not be validated.',
        },
      });

      // Socket announcement
      const io = getIO(req);
      if (io) {
        io.to(`worker_${worker.id}`).emit('worker_verification_result', {
          status: 'rejected',
          reason: reason || 'Documentation could not be verified.',
        });
      }

      return res.json({
        success: true,
        message: `Worker ${worker.fullName} application has been Rejected. Notification email sent.`,
        worker: updated,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' });
    }
  } catch (err) {
    console.error('Error verifying worker:', err);
    res.status(500).json({ success: false, message: 'Failed to process worker verification.' });
  }
});

// 4. Get All Workers (with search, filter, pagination)
router.get('/workers', (req, res) => {
  try {
    const { status, skill, search } = req.query;
    let list = [...storage.getWorkers()];

    if (status && status !== 'all') {
      list = list.filter((w) => w.status === status);
    }

    if (skill && skill !== 'all') {
      list = list.filter((w) => w.skill.toLowerCase() === skill.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.fullName.toLowerCase().includes(q) ||
          w.email.toLowerCase().includes(q) ||
          w.mobile.includes(q) ||
          w.location.toLowerCase().includes(q) ||
          w.skill.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: list.length, workers: list });
  } catch (err) {
    console.error('Error listing all workers for admin:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch workers list.' });
  }
});

// 5. Suspend or Reactivate Worker
router.put('/workers/:id/status', (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'suspended'
    const worker = storage.findWorkerById(req.params.id);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const updated = storage.updateWorker(worker.id, {
      status: status === 'suspended' ? 'suspended' : 'approved',
    });

    const io = getIO(req);
    if (io) {
      io.to(`worker_${worker.id}`).emit('worker_status_changed', { status: updated.status });
      io.emit('worker_directory_updated', { workerId: worker.id, status: updated.status });
    }

    res.json({
      success: true,
      message: `Worker ${worker.fullName} status updated to ${updated.status}.`,
      worker: updated,
    });
  } catch (err) {
    console.error('Error updating worker status:', err);
    res.status(500).json({ success: false, message: 'Failed to update worker status.' });
  }
});

// 6. Delete Worker (Remove Fake Account)
router.delete('/workers/:id', (req, res) => {
  try {
    const worker = storage.findWorkerById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    storage.deleteWorker(worker.id);

    const io = getIO(req);
    if (io) {
      io.emit('worker_directory_updated', { workerId: worker.id, deleted: true });
    }

    res.json({
      success: true,
      message: `Worker account ${worker.fullName} (${worker.email}) permanently removed.`,
    });
  } catch (err) {
    console.error('Error removing worker:', err);
    res.status(500).json({ success: false, message: 'Failed to delete worker.' });
  }
});

// 7. Get All Bookings Across Platform
router.get('/bookings', (req, res) => {
  try {
    const { status } = req.query;
    let bookings = storage.getBookings();

    if (status && status !== 'all') {
      bookings = bookings.filter((b) => b.status === status);
    }

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Error fetching admin bookings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// 8. Reset Platform Demo Seeds
router.post('/reset-demo', (req, res) => {
  try {
    storage.resetToSeeds();
    res.json({ success: true, message: 'Platform demo data has been reset to default state.' });
  } catch (err) {
    console.error('Error resetting demo:', err);
    res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
});

export default router;
