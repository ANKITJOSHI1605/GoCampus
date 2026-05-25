const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  availableSeats: {
    type: Number,
    default: function() {
      return this.capacity;
    }
  },
  driverName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Idle', 'On Route', 'Maintenance'],
    default: 'Idle',
  },
  currentLocation: {
    lat: Number,
    lng: Number,
  },
  route: {
    type: String, // String representation for simplicity initially
  },
  busCode: {
    type: String,
    default: '',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
