const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('roomId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a booking
router.post('/', async (req, res) => {
  try {
    const { roomId, guestName, guestEmail, guestPhone, checkIn, checkOut, totalNights, totalAmount } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      roomId,
      bookingStatus: { $in: ['Confirmed', 'Checked-In'] },
      $or: [
        { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ error: 'Room is already booked for these selected dates.' });
    }

    const booking = new Booking({
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      totalNights,
      totalAmount
    });

    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH check-in / check-out status
router.patch('/:id/status', async (req, res) => {
  try {
    const { bookingStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.bookingStatus = bookingStatus;
    await booking.save();

    if (bookingStatus === 'Checked-In') {
      await Room.findByIdAndUpdate(booking.roomId, { status: 'Occupied' });
    } else if (bookingStatus === 'Checked-Out') {
      await Room.findByIdAndUpdate(booking.roomId, { status: 'Cleaning' });
    } else if (bookingStatus === 'Cancelled') {
      await Room.findByIdAndUpdate(booking.roomId, { status: 'Available' });
    }

    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
