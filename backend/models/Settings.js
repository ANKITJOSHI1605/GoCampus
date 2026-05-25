const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  pickups: {
    // Format: [{ label: 'All Stations', times: ['7:00 AM', '11:00 AM', '2:00 PM'] }]
    type: Array,
    default: []
  },
  departures: {
    // Format: [{ label: '1st Departure', time: '10:00 AM' }]
    type: Array,
    default: []
  }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  activeScheduleType: {
    type: String,
    enum: ['regular', 'temporary'],
    default: 'regular'
  },
  temporaryScheduleTitle: {
    type: String,
    default: 'Revised Bus Schedule'
  },
  destinationLocation: {
    lat: { type: Number, default: 30.2675 },
    lng: { type: Number, default: 77.9959 },
    name: { type: String, default: 'Graphic Era Hill University' }
  },
  regularSchedule: {
    type: ScheduleSchema,
    default: () => ({})
  },
  temporarySchedule: {
    type: ScheduleSchema,
    default: () => ({})
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
