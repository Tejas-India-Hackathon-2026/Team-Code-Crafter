import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialAdmin, initialCustomers, initialWorkers, initialBookings, initialReviews } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// Memory store
let db = {
  admin: { ...initialAdmin },
  customers: [...initialCustomers],
  workers: [...initialWorkers],
  bookings: [...initialBookings],
  reviews: [...initialReviews],
  messages: [],
  emails: [
    {
      id: 'em_01',
      to: 'rahul.electrician@example.com',
      subject: 'WorkerConnect: Welcome to WorkerConnect! Account Approved',
      type: 'worker_approval',
      recipientName: 'Rahul Sharma',
      previewText: 'Congratulations! Your profile as a Master Electrician has been verified and approved by the admin team.',
      sentAt: '2025-01-05T08:05:00Z',
      status: 'delivered'
    },
    {
      id: 'em_02',
      to: 'priya.customer@example.com',
      subject: 'Booking Confirmation: Electrician Service Request Received',
      type: 'booking_created',
      recipientName: 'Priya Sharma',
      previewText: 'Your booking request #bk_101 has been sent to Rahul Sharma. You will receive an alert once accepted.',
      sentAt: '2025-02-20T08:30:05Z',
      status: 'delivered'
    }
  ]
};

// Initialize persistent storage
function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      db = {
        admin: loaded.admin || { ...initialAdmin },
        customers: loaded.customers || [...initialCustomers],
        workers: loaded.workers || [...initialWorkers],
        bookings: loaded.bookings || [...initialBookings],
        reviews: loaded.reviews || [...initialReviews],
        messages: loaded.messages || [],
        emails: loaded.emails || []
      };
      console.log('📦 Loaded database from JSON persistence');
    } else {
      saveStorage();
      console.log('🌱 Initialized database with realistic seed data');
    }
  } catch (err) {
    console.error('Error initializing storage:', err.message);
  }
}

function saveStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving storage:', err.message);
  }
}

// Distance Calculation Helper using Haversine formula (in km)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

// Storage Operations
export const storage = {
  init: initStorage,
  save: saveStorage,

  // Admin
  getAdmin: () => db.admin,
  findAdminByEmail: (email) => (db.admin.email.toLowerCase() === email.toLowerCase() ? db.admin : null),

  // Customers
  getCustomers: () => db.customers,
  findCustomerById: (id) => db.customers.find((c) => c.id === id),
  findCustomerByEmail: (email) => db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase()),
  createCustomer: (customer) => {
    db.customers.unshift(customer);
    saveStorage();
    return customer;
  },
  updateCustomer: (id, updates) => {
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.customers[idx] = { ...db.customers[idx], ...updates, updatedAt: new Date().toISOString() };
      saveStorage();
      return db.customers[idx];
    }
    return null;
  },

  // Workers
  getWorkers: () => db.workers,
  findWorkerById: (id) => db.workers.find((w) => w.id === id),
  findWorkerByEmail: (email) => db.workers.find((w) => w.email.toLowerCase() === email.toLowerCase()),
  createWorker: (worker) => {
    db.workers.unshift(worker);
    saveStorage();
    return worker;
  },
  updateWorker: (id, updates) => {
    const idx = db.workers.findIndex((w) => w.id === id);
    if (idx !== -1) {
      db.workers[idx] = { ...db.workers[idx], ...updates, updatedAt: new Date().toISOString() };
      saveStorage();
      return db.workers[idx];
    }
    return null;
  },
  deleteWorker: (id) => {
    const idx = db.workers.findIndex((w) => w.id === id);
    if (idx !== -1) {
      const removed = db.workers.splice(idx, 1)[0];
      saveStorage();
      return removed;
    }
    return null;
  },

  // Bookings
  getBookings: () => db.bookings,
  findBookingById: (id) => db.bookings.find((b) => b.id === id),
  findBookingsByCustomer: (customerId) => db.bookings.filter((b) => b.customerId === customerId),
  findBookingsByWorker: (workerId) => db.bookings.filter((b) => b.workerId === workerId),
  createBooking: (booking) => {
    db.bookings.unshift(booking);
    saveStorage();
    return booking;
  },
  updateBooking: (id, updates) => {
    const idx = db.bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      db.bookings[idx] = { ...db.bookings[idx], ...updates, updatedAt: new Date().toISOString() };
      saveStorage();
      return db.bookings[idx];
    }
    return null;
  },

  // Booking chat messages
  getMessagesByBooking: (bookingId) =>
    db.messages
      .filter((message) => message.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  createMessage: (message) => {
    db.messages.push(message);
    saveStorage();
    return message;
  },

  // Reviews
  getReviews: () => db.reviews,
  getReviewsByWorker: (workerId) => db.reviews.filter((r) => r.workerId === workerId),
  createReview: (review) => {
    db.reviews.unshift(review);
    // Recalculate worker rating
    const workerReviews = db.reviews.filter((r) => r.workerId === review.workerId);
    const avgRating =
      workerReviews.reduce((sum, r) => sum + Number(r.rating), 0) / workerReviews.length;
    const workerIdx = db.workers.findIndex((w) => w.id === review.workerId);
    if (workerIdx !== -1) {
      db.workers[workerIdx].rating = Math.round(avgRating * 10) / 10;
      db.workers[workerIdx].reviewCount = workerReviews.length;
    }
    saveStorage();
    return review;
  },

  // Emails
  getEmails: () => db.emails,
  logEmail: (emailData) => {
    const entry = {
      id: 'em_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      sentAt: new Date().toISOString(),
      status: 'delivered',
      ...emailData,
    };
    db.emails.unshift(entry);
    if (db.emails.length > 50) db.emails.pop(); // keep last 50
    saveStorage();
    return entry;
  },

  // Reset to seeds helper (useful for testing or demo reset)
  resetToSeeds: () => {
    db = {
      admin: { ...initialAdmin },
      customers: [...initialCustomers],
      workers: [...initialWorkers],
      bookings: [...initialBookings],
      reviews: [...initialReviews],
      messages: [],
      emails: []
    };
    saveStorage();
  }
};
