const express = require('express');
const Bus = require('../models/Bus');

const router = express.Router();

const { getRouteForBus } = require('../config/routingHelper');

// @route   GET /api/buses
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find({});
    
    // Compute and attach the OSRM street route path coordinates to each active bus
    const busesWithPaths = await Promise.all(
      buses.map(async (bus) => {
        const busObj = bus.toObject();
        if (bus.currentLocation && bus.currentLocation.lat !== undefined && bus.currentLocation.lng !== undefined) {
          busObj.routePath = await getRouteForBus(
            bus._id.toString(),
            bus.currentLocation.lat,
            bus.currentLocation.lng
          );
        } else {
          busObj.routePath = null;
        }
        return busObj;
      })
    );
    
    res.json(busesWithPaths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/buses
router.post('/', async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/buses/:id
// @desc    Update bus location and status
router.put('/:id', async (req, res) => {
  try {
    if (req.body.capacity !== undefined && req.body.availableSeats === undefined) {
      req.body.availableSeats = req.body.capacity;
    }
    const bus = await Bus.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// @route   DELETE /api/buses/:id
// @desc    Delete a bus
router.delete('/:id', async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
