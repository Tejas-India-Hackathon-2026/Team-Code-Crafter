import express from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../config/storage.js';
import { generateToken, authenticateToken } from '../middleware/authMiddleware.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();
const resetRequests = new Map();

// Helper to get socket IO instance if attached to app
function getIO(req) {
  return req.app.get('io');
}

// 1. Customer Sign Up
router.post('/register-customer', async (req, res) => {
  try {
    const { fullName, mobile, email, password, confirmPassword, location } = req.body;

    if (!fullName || !mobile || !email || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check existing email across customer, worker, admin
    if (storage.findCustomerByEmail(email) || storage.findWorkerByEmail(email) || storage.findAdminByEmail(email)) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = {
      id: 'cust_' + Date.now().toString(36),
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      location: location || 'Indiranagar, Bengaluru',
      lat: 12.9784,
      lng: 77.6408,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      createdAt: new Date().toISOString(),
    };

    storage.createCustomer(newCustomer);

    // Send Welcome Email
    sendEmail({
      to: newCustomer.email,
      subject: 'Welcome to WorkerConnect!',
      type: 'customer_registered',
      recipientName: newCustomer.fullName,
      templateData: {},
    });

    const token = generateToken(newCustomer);
    const { password: _, ...userSafe } = newCustomer;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to WorkerConnect.',
      token,
      user: userSafe,
    });
  } catch (err) {
    console.error('Customer signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// 2. Worker Sign Up
router.post('/register-worker', async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      password,
      confirmPassword,
      skill,
      subSkill,
      experience,
      location,
      lat,
      lng,
      servicePrice,
      priceUnit,
      description,
      avatar,
      idProofNumber,
      skillCertificateNumber,
      governmentIdDocument,
      skillCertificateDocument,
      documentUrl,
    } = req.body;

    if (!fullName || !mobile || !email || !password || !skill || !servicePrice) {
      return res.status(400).json({ success: false, message: 'Please fill in all mandatory worker details.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const validatePdf = (document, label) => {
      if (typeof document !== 'string' || !document.startsWith('data:application/pdf;base64,')) {
        return `${label} must be a PDF file.`;
      }
      const base64 = document.split(',')[1] || '';
      const byteLength = Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
      if (byteLength > 100 * 1024) return `${label} must be 100KB or smaller.`;
      return null;
    };

    if (!idProofNumber?.trim()) {
      return res.status(400).json({ success: false, message: 'Government ID number is required.' });
    }

    if (!skillCertificateNumber?.trim()) {
      return res.status(400).json({ success: false, message: 'Skill certificate or skill ID number is required.' });
    }

    const governmentIdError = validatePdf(governmentIdDocument, 'Government ID document');
    const skillCertificateError = validatePdf(skillCertificateDocument, 'Skill certificate');
    if (governmentIdError || skillCertificateError) {
      return res.status(400).json({ success: false, message: governmentIdError || skillCertificateError });
    }

    const workerLat = Number(lat);
    const workerLng = Number(lng);
    if (!Number.isFinite(workerLat) || workerLat < -90 || workerLat > 90 || !Number.isFinite(workerLng) || workerLng < -180 || workerLng > 180) {
      return res.status(400).json({ success: false, message: 'Please allow GPS access and select a valid service location.' });
    }

    // Check existing email
    if (storage.findWorkerByEmail(email) || storage.findCustomerByEmail(email) || storage.findAdminByEmail(email)) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = {
      id: 'wrk_' + Date.now().toString(36),
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'worker',
      skill,
      subSkill: subSkill || '',
      experience: Number(experience) || 1,
      location: location || 'Bengaluru',
      lat: workerLat,
      lng: workerLng,
      servicePrice: Number(servicePrice),
      priceUnit: priceUnit || 'per visit',
      description: description || 'Skilled professional ready to assist with high quality service.',
      avatar:
        avatar ||
        `https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80`,
      status: 'pending_verification', // MUST be pending verification initially
      isAvailable: true,
      rating: 5.0,
      reviewCount: 0,
      completedJobs: 0,
      idProofNumber: idProofNumber || 'ID-VERIFY-' + Math.floor(10000 + Math.random() * 90000),
      skillCertificateNumber: skillCertificateNumber.trim(),
      governmentIdDocument,
      skillCertificateDocument,
      documentUrl:
        documentUrl ||
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    storage.createWorker(newWorker);

    // Send Registration Email acknowledging pending status
    sendEmail({
      to: newWorker.email,
      subject: 'WorkerConnect Application Received – Pending Verification',
      type: 'worker_registered',
      recipientName: newWorker.fullName,
      templateData: {
        skill: newWorker.skill,
        experience: newWorker.experience,
        location: newWorker.location,
      },
    });

    // Notify connected Admin sockets via Socket.IO
    const io = getIO(req);
    if (io) {
      io.emit('admin_new_worker_application', {
        id: newWorker.id,
        fullName: newWorker.fullName,
        skill: newWorker.skill,
        experience: newWorker.experience,
        createdAt: newWorker.createdAt,
      });
    }

    const token = generateToken(newWorker);
    const {
      password: _,
      skillCertificateNumber: _skillCertificateNumber,
      governmentIdDocument: __,
      skillCertificateDocument: ___,
      ...workerSafe
    } = newWorker;

    res.status(201).json({
      success: true,
      message:
        'Registration submitted successfully! Your account is currently in Pending Verification status. An admin will review and approve your profile.',
      token,
      user: workerSafe,
      isPending: true,
    });
  } catch (err) {
    console.error('Worker signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during worker registration.' });
  }
});

// 3. Universal Login (Customer, Worker, Admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Admin
    const admin = storage.findAdminByEmail(cleanEmail);
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (match) {
        const token = generateToken(admin);
        const { password: _, ...safeAdmin } = admin;
        return res.json({
          success: true,
          message: 'Admin authenticated successfully',
          token,
          user: safeAdmin,
        });
      }
    }

    // 2. Check Worker
    const worker = storage.findWorkerByEmail(cleanEmail);
    if (worker) {
      const match = await bcrypt.compare(password, worker.password);
      if (match) {
        const token = generateToken(worker);
        const {
          password: _,
          skillCertificateNumber: _skillCertificateNumber,
          governmentIdDocument: __,
          skillCertificateDocument: ___,
          ...safeWorker
        } = worker;
        return res.json({
          success: true,
          message:
            worker.status === 'pending_verification'
              ? 'Logged in. Your profile is currently Pending Verification.'
              : 'Worker logged in successfully.',
          token,
          user: safeWorker,
          isPending: worker.status === 'pending_verification',
          isSuspended: worker.status === 'suspended',
        });
      }
    }

    // 3. Check Customer
    const customer = storage.findCustomerByEmail(cleanEmail);
    if (customer) {
      const match = await bcrypt.compare(password, customer.password);
      if (match) {
        const token = generateToken(customer);
        const { password: _, ...safeCustomer } = customer;
        return res.json({
          success: true,
          message: 'Customer logged in successfully.',
          token,
          user: safeCustomer,
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// 4. Admin Login with the pre-registered admin email
router.post('/admin-login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required.' });
    }

    const admin = storage.getAdmin();
    const match = admin && (await bcrypt.compare(password, admin.password));

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid admin password.' });
    }

    const token = generateToken(admin);
    const { password: _, ...safeAdmin } = admin;
    return res.json({
      success: true,
      message: 'Admin authenticated successfully',
      token,
      user: safeAdmin,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
});

// 5. Forgot Password Simulation
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user =
      storage.findCustomerByEmail(cleanEmail) ||
      storage.findWorkerByEmail(cleanEmail) ||
      storage.findAdminByEmail(cleanEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    const resetCode = 'WC-' + Math.floor(100000 + Math.random() * 900000);
    resetRequests.set(cleanEmail, {
      code: resetCode,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    sendEmail({
      to: user.email,
      subject: 'WorkerConnect: Password Reset Instructions',
      type: 'password_reset',
      recipientName: user.fullName,
      templateData: {
        resetCode,
      },
    });

    res.json({
      success: true,
      message: `Password reset instructions and verification code sent to ${cleanEmail}. Check the live Email Log to view it!`,
      resetCode,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error during password reset request.' });
  }
});

// 5. Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset code and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const resetRequest = resetRequests.get(cleanEmail);
    if (!resetRequest || resetRequest.code !== resetCode || resetRequest.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const worker = storage.findWorkerByEmail(cleanEmail);
    if (worker) {
      storage.updateWorker(worker.id, { password: hashedPassword });
      resetRequests.delete(cleanEmail);
      return res.json({ success: true, message: 'Password has been successfully updated. Please log in.' });
    }

    const customer = storage.findCustomerByEmail(cleanEmail);
    if (customer) {
      storage.updateCustomer(customer.id, { password: hashedPassword });
      resetRequests.delete(cleanEmail);
      return res.json({ success: true, message: 'Password has been successfully updated. Please log in.' });
    }

    const admin = storage.findAdminByEmail(cleanEmail);
    if (admin) {
      admin.password = hashedPassword;
      storage.save();
      resetRequests.delete(cleanEmail);
      return res.json({ success: true, message: 'Admin password updated successfully.' });
    }

    return res.status(404).json({ success: false, message: 'User not found.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error during password update.' });
  }
});

// 6. Get Current Authenticated User (Profile & Session Refresh)
router.get('/me', authenticateToken, (req, res) => {
  const { id, role } = req.user;
  let user = null;

  if (role === 'admin') user = storage.getAdmin();
  else if (role === 'worker') user = storage.findWorkerById(id);
  else if (role === 'customer') user = storage.findCustomerById(id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }

  const {
    password: _,
    skillCertificateNumber: _skillCertificateNumber,
    governmentIdDocument: __,
    skillCertificateDocument: ___,
    ...userSafe
  } = user;
  res.json({ success: true, user: userSafe });
});

export default router;