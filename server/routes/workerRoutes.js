import express from 'express';
import { storage, calculateDistance } from '../config/storage.js';
import { authenticateToken, requireWorker } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Public Search & Filter for Approved Workers
router.get('/', (req, res) => {
  try {
    const {
      skill,
      location,
      lat,
      lng,
      query,
      sortBy = 'rating', // 'rating', 'distance', 'price_asc', 'price_desc', 'experience'
      maxDistance = 50, // in km
    } = req.query;

    const userLat = lat ? Number(lat) : null;
    const userLng = lng ? Number(lng) : null;

    // Filter only approved workers (and not suspended)
    let workers = storage.getWorkers().filter((w) => w.status === 'approved');

    // Filter by Skill category
    if (skill && skill.toLowerCase() !== 'all') {
      workers = workers.filter(
        (w) =>
          w.skill.toLowerCase() === skill.toLowerCase() ||
          (w.subSkill && w.subSkill.toLowerCase() === skill.toLowerCase())
      );
    }

    // Filter by text search (name, location, description, skill)
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      workers = workers.filter(
        (w) =>
          w.fullName.toLowerCase().includes(q) ||
          w.skill.toLowerCase().includes(q) ||
          (w.subSkill && w.subSkill.toLowerCase().includes(q)) ||
          w.location.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }

    // Filter by location text match if provided without GPS
    if (location && location.trim() !== '') {
      const locQ = location.toLowerCase().trim();
      workers = workers.filter((w) => w.location.toLowerCase().includes(locQ));
    }

    // Attach computed distance
    const workersWithDistance = workers.map((w) => {
      let dist = null;
      if (userLat && userLng && w.lat && w.lng) {
        dist = calculateDistance(userLat, userLng, w.lat, w.lng);
      }
      const { password, idProofNumber, ...workerSafe } = w;
      return {
        ...workerSafe,
        distanceKm: dist,
      };
    });

    // Filter by max distance if user coordinates are provided
    let results = workersWithDistance;
    if (userLat && userLng && maxDistance) {
      results = results.filter((w) => w.distanceKm !== null && w.distanceKm <= Number(maxDistance));
    }

    // Sorting
    results.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      } else if (sortBy === 'price_asc') {
        return a.servicePrice - b.servicePrice;
      } else if (sortBy === 'price_desc') {
        return b.servicePrice - a.servicePrice;
      } else if (sortBy === 'experience') {
        return b.experience - a.experience;
      } else {
        // Default: rating desc, then reviewCount desc
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      }
    });

    res.json({
      success: true,
      count: results.length,
      workers: results,
    });
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ success: false, message: 'Failed to search workers.' });
  }
});

// 2. Worker Dashboard Stats (Authenticated Worker)
router.get('/dashboard/stats', requireWorker, (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = storage.findWorkerById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker account not found.' });
    }

    const allBookings = storage.findBookingsByWorker(workerId);
    const pendingRequests = allBookings.filter((b) => b.status === 'pending');
    const acceptedJobs = allBookings.filter((b) => b.status === 'accepted');
    const completedJobs = allBookings.filter((b) => b.status === 'completed');
    const rejectedJobs = allBookings.filter((b) => b.status === 'rejected');

    // Calculate total estimated earnings from completed jobs
    const totalEarnings = completedJobs.reduce((sum, b) => sum + (Number(b.estimatedPrice) || 0), 0);

    res.json({
      success: true,
      stats: {
        totalBookings: allBookings.length,
        pendingCount: pendingRequests.length,
        acceptedCount: acceptedJobs.length,
        completedCount: completedJobs.length,
        rejectedCount: rejectedJobs.length,
        rating: worker.rating,
        reviewCount: worker.reviewCount || 0,
        earnings: totalEarnings,
        isAvailable: worker.isAvailable,
        status: worker.status,
      },
      worker: {
        id: worker.id,
        fullName: worker.fullName,
        skill: worker.skill,
        status: worker.status,
        avatar: worker.avatar,
        servicePrice: worker.servicePrice,
        priceUnit: worker.priceUnit,
      },
    });
  } catch (err) {
    console.error('Error getting worker dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
});

// 3. Toggle Worker Availability Status (Online / Offline)
router.put('/availability', requireWorker, (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = storage.findWorkerById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const { isAvailable } = req.body;
    const updated = storage.updateWorker(workerId, {
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : !worker.isAvailable,
    });

    res.json({
      success: true,
      message: `Availability updated to ${updated.isAvailable ? 'Available / Online' : 'Busy / Offline'}`,
      isAvailable: updated.isAvailable,
    });
  } catch (err) {
    console.error('Error toggling availability:', err);
    res.status(500).json({ success: false, message: 'Failed to update availability.' });
  }
});

// 4. Update Worker Profile
router.put('/profile', requireWorker, (req, res) => {
  try {
    const workerId = req.user.id;
    const { fullName, mobile, location, lat, lng, servicePrice, priceUnit, description, avatar, subSkill } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (mobile) updates.mobile = mobile;
    if (location) updates.location = location;
    if (lat) updates.lat = Number(lat);
    if (lng) updates.lng = Number(lng);
    if (servicePrice) updates.servicePrice = Number(servicePrice);
    if (priceUnit) updates.priceUnit = priceUnit;
    if (description) updates.description = description;
    if (avatar) updates.avatar = avatar;
    if (subSkill) updates.subSkill = subSkill;

    const updatedWorker = storage.updateWorker(workerId, updates);
    const { password, ...safeWorker } = updatedWorker;

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      worker: safeWorker,
    });
  } catch (err) {
    console.error('Error updating worker profile:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// Public profile route must remain after fixed routes such as /dashboard/stats.
router.get('/:id', (req, res) => {
  try {
    const worker = storage.findWorkerById(req.params.id);
    if (!worker || worker.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const reviews = storage.getReviewsByWorker(worker.id);
    const { password, idProofNumber, documentUrl, ...workerSafe } = worker;

    res.json({ success: true, worker: workerSafe, reviews });
  } catch (err) {
    console.error('Error getting worker profile:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch worker details.' });
  }
});

export default router;
