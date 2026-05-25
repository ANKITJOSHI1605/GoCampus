const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Default seeding function to initialize settings if none exist
const initializeSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings({
      activeScheduleType: 'regular',
      temporaryScheduleTitle: 'Revised Bus Schedule During Final Year End-Semester Examinations',
      destinationLocation: { lat: 30.2675, lng: 77.9959, name: 'Graphic Era Hill University' },
      regularSchedule: {
        pickups: [
          { label: 'All Stations (Default)', times: ['7:00 AM', '11:00 AM', '2:00 PM'] },
          { label: 'Vikasnagar, Kulhal, Nepali Farm, Rani Pokhri, Bahuwala', times: ['6:10 AM', '10:10 AM', '1:10 PM'] },
          { label: 'Khirsali Chowk, Gujraunwala, Rajpur, Selaqui Chowk, Doiwala', times: ['6:35 AM', '10:35 AM', '1:35 PM'] }
        ],
        departures: [
          { label: '1st Departure', time: '10:00 AM' },
          { label: '2nd Departure', time: '1:15 PM' },
          { label: '3rd Departure', time: '5:15 PM' }
        ]
      },
      temporarySchedule: {
        pickups: [
          { label: 'All Stations (Default)', times: ['8:00 AM', '12:00 PM', ''] },
          { label: 'Vikasnagar, Kulhal, Nepali Farm, Rani Pokhri, Bahuwala', times: ['7:10 AM', '11:10 AM', ''] },
          { label: 'Khirsali Chowk, Gujraunwala, Rajpur, Selaqui Chowk, Doiwala', times: ['7:35 AM', '11:35 AM', ''] }
        ],
        departures: [
          { label: '1st Departure', time: '1:15 PM' },
          { label: '2nd Departure', time: '5:15 PM' },
          { label: '3rd Departure', time: '' }
        ]
      }
    });
    await settings.save();
  }
  return settings;
};

// GET /api/settings/schedule
router.get('/schedule', async (req, res) => {
  try {
    const settings = await initializeSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schedule settings' });
  }
});

// PUT /api/settings/schedule
router.put('/schedule', async (req, res) => {
  try {
    const { activeScheduleType, temporaryScheduleTitle, regularSchedule, temporarySchedule, destinationLocation } = req.body;
    
    let settings = await initializeSettings();
    
    if (activeScheduleType) settings.activeScheduleType = activeScheduleType;
    if (temporaryScheduleTitle !== undefined) settings.temporaryScheduleTitle = temporaryScheduleTitle;
    if (regularSchedule) settings.regularSchedule = regularSchedule;
    if (temporarySchedule) settings.temporarySchedule = temporarySchedule;
    if (destinationLocation) settings.destinationLocation = destinationLocation;

    await settings.save();
    
    // Broadcast changes via socket using req.app.get('io')
    const io = req.app.get('io');
    if (io) {
      io.emit('scheduleUpdated', settings);
    }
    
    res.json(settings);
  } catch (err) {
    console.error('Update schedule error:', err);
    res.status(500).json({ error: 'Failed to update schedule settings' });
  }
});

module.exports = router;
