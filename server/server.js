import express from 'express';
import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { storage } from './config/storage.js';
import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import emailRoutes from './routes/emailRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach io to express app so routes can broadcast events
app.set('io', io);

// Initialize persistence storage & seed state
storage.init();

// Socket.IO Room Management
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

  // User joins their personal room (customer_123 or worker_456 or admin_room)
  socket.on('join_user_room', ({ userId, role }) => {
    if (userId) {
      const room = `${role}_${userId}`;
      socket.join(room);
      console.log(`👤 Socket ${socket.id} joined personal room: ${room}`);
    }
    if (role === 'admin') {
      socket.join('admin_room');
      console.log(`🛡️ Socket ${socket.id} joined admin_room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'WorkerConnect API Server',
    time: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      '/api/workers',
      '/api/bookings',
      '/api/auth/login',
      '/api/admin/stats',
      '/api/emails/logs'
    ]
  });
});

// Serve frontend static build if exists, or show an interactive status hub
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  // If dist doesn't exist yet, show a welcome landing hub with link to dev server
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WorkerConnect API Server</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px; max-width: 540px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }
          .badge { display: inline-block; background: #00D4D4; color: #042f2e; padding: 6px 14px; border-radius: 9999px; font-weight: 800; font-size: 12px; margin-bottom: 15px; }
          h1 { margin: 0 0 10px 0; font-size: 26px; font-weight: 800; }
          p { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 25px; }
          .btn { display: inline-block; background: #00D4D4; color: #042f2e; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; transition: transform 0.2s; box-shadow: 0 4px 14px rgba(0,212,212,0.3); }
          .btn:hover { transform: translateY(-2px); }
          .info { background: #f1f5f9; border-radius: 12px; padding: 15px; text-align: left; font-size: 12px; margin-top: 25px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">⚡ SERVER ONLINE</div>
          <h1>WorkerConnect Backend API</h1>
          <p>The backend server is running smoothly on port 5000. To view the complete user interface website with all features and dashboards, open the frontend application:</p>
          <a class="btn" href="http://localhost:5173" target="_blank">🚀 Open WorkerConnect Web App (Port 5173)</a>
          <div class="info">
            <strong>Key API Endpoints:</strong>
            <ul style="margin: 5px 0 0 0; padding-left: 20px;">
              <li><a href="/api/health">/api/health</a> - Status</li>
              <li><a href="/api/workers">/api/workers</a> - Workers Directory</li>
              <li><a href="/api/emails/logs">/api/emails/logs</a> - Transactional Emails</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ WorkerConnect Backend API & Socket Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
