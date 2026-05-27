const express = require('express');
const Bus = require('../models/Bus');

const router = express.Router();

// @route   GET /api/buses
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find({});
    res.json(buses);
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

module.exports = router;
