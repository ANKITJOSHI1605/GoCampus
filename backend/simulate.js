const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bus = require('./models/Bus');
const User = require('./models/User');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('123456', salt);

    // Clear stale database collections for a fresh production-ready state
    await User.deleteMany({});
    await Bus.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing Users, Buses, and Notifications.');

    // Seed Aligned User Accounts
    await User.insertMany([
      { name: 'System Admin', email: 'admin@gocampus.com', password, role: 'admin' },
      { name: 'Driver User', email: 'driver@gocampus.com', password, role: 'driver' },
      { name: 'rajesh kumar', email: 'rajesh@gocampus.com', password, role: 'driver' },
      { name: 'Student User', email: 'student@gocampus.com', password, role: 'student' },
      { name: 'Rahul', email: 'rahul@gocampus.com', password, role: 'student' }
    ]);
    console.log('Seeded aligned Admin, Driver, and Student accounts.');

    // Seed Aligned Buses
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
    console.log('Seeded aligned, active Buses with default capacity 19.');

    // Seed Clean Notifications
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
    console.log('Seeded sample system notifications.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during database seeding: ${error.message}`);
    process.exit(1);
  }
};

importData();
