const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new room (Admin)
router.post('/', async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH room status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
