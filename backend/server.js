const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Load env
dotenv.config();

// Initialize app & server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.set('io', io);

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Security Middleware
// Set security headers (CSP disabled to allow React frontend to load assets easily)
app.use(helmet({ contentSecurityPolicy: false })); 

// Prevent NoSQL injection
app.use(mongoSanitize()); 

// Relax rate limiting for campus scale (10,000 requests per 10 minutes per IP to support NAT and multi-client testing)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 10000 
});
app.use('/api', limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Explicitly protected development/demo database seeding endpoint.
app.post('/api/seed', async (req, res) => {
  if (!process.env.SEED_SECRET || req.get('x-seed-secret') !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'Database seeding is disabled.' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const Bus = require('./models/Bus');
    const Notification = require('./models/Notification');
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('123456', salt);

    // Clear stale database collections
    await User.deleteMany({});
    await Bus.deleteMany({});
    await Notification.deleteMany({});

    // Seed aligned User Accounts
    await User.insertMany([
      { name: 'System Admin', email: 'admin@gocampus.com', password, role: 'admin' },
      { name: 'Driver User', email: 'driver@gocampus.com', password, role: 'driver' },
      { name: 'rajesh kumar', email: 'rajesh@gocampus.com', password, role: 'driver' },
      { name: 'Student User', email: 'student@gocampus.com', password, role: 'student' },
      { name: 'Rahul', email: 'rahul@gocampus.com', password, role: 'student' }
    ]);

    // Seed aligned active Buses
    await Bus.insertMany([
      {
        busNumber: 'UK07-9012',
        capacity: 19,
        availableSeats: 19,
        driverName: 'Driver User',
        status: 'On Route',
        route: 'ISBT to GEU',
        currentLocation: { lat: 30.2686, lng: 78.0019 },
        busCode: '22',
        lastUpdated: new Date()
      },
      {
        busNumber: 'UK07-1234',
        capacity: 19,
        availableSeats: 19,
        driverName: 'rajesh kumar',
        status: 'On Route',
        route: 'Clock Tower to GEU',
        currentLocation: { lat: 30.2720, lng: 77.9950 },
        busCode: '3',
        lastUpdated: new Date()
      }
    ]);

    // Seed clean initial Notifications
    await Notification.insertMany([
      {
        message: 'Revised bus schedule during final semester examinations is now active.',
        type: 'info',
        createdAt: new Date()
      },
      {
        message: 'Slight delay expected on Vikasnagar route due to road maintenance.',
        type: 'warning',
        createdAt: new Date(Date.now() - 3600000)
      }
    ]);

    res.json({ message: 'Database seeding completed successfully.' });
  } catch (err) {
    console.error('Database seeding failed:', err);
    res.status(500).json({ error: 'Database seeding failed.' });
  }
});

// Serve Frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  // Simple root route
  app.get('/', (req, res) => {
    res.send('GoCampus API is running automatically...');
  });
}

// Socket logic mapping
require('./sockets/socketHandler')(io);

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Process-level crash prevention
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception caught to prevent crash:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Promise Rejection caught to prevent crash:', reason);
});
