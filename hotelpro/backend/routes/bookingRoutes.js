const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');

const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwKwXGxvqBEClykZzcDLmvsllYaeeHmVbwiClh68QtuWCEschJZTrATUdsrMThXof-VyQ/exec";

function syncToGoogleSheet(payload) {
  fetch(GOOGLE_SHEET_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow"
  }).catch((err) => {
    console.error("Silent Sheet Sync Error:", err.message);
  });
}

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('roomId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { roomId, guestName, guestEmail, guestPhone, checkIn, checkOut, totalNights, totalAmount } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

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

    syncToGoogleSheet({
      guestName: savedBooking.guestName || "N/A",
      guestEmail: savedBooking.guestEmail || "N/A",
      roomNumber: room.roomNumber || "N/A",
      roomTitle: room.title || "N/A",
      checkInDate: savedBooking.checkIn ? new Date(savedBooking.checkIn).toLocaleDateString("en-IN") : "N/A",
      checkOutDate: savedBooking.checkOut ? new Date(savedBooking.checkOut).toLocaleDateString("en-IN") : "N/A",
      bookingStatus: savedBooking.bookingStatus || "Confirmed",
      actualCheckInTime: "—",
      actualCheckOutTime: "—"
    });

    res.status(201).json(savedBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { bookingStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const currentIndianTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    booking.bookingStatus = bookingStatus;
    if (bookingStatus === 'Checked-In') {
      booking.actualCheckInTime = currentIndianTime;
      await Room.findByIdAndUpdate(booking.roomId, { status: 'Occupied' });
    } else if (bookingStatus === 'Checked-Out') {
      booking.actualCheckOutTime = currentIndianTime;
      await Room.findByIdAndUpdate(booking.roomId, { status: 'Cleaning' });
    } else if (bookingStatus === 'Cancelled') {
      await Room.findByIdAndUpdate(booking.roomId, { status: 'Available' });
    }

    await booking.save();

    const room = await Room.findById(booking.roomId);

    syncToGoogleSheet({
      guestName: booking.guestName || "N/A",
      guestEmail: booking.guestEmail || "N/A",
      roomNumber: room ? room.roomNumber : "N/A",
      roomTitle: room ? room.title : "N/A",
      checkInDate: booking.checkIn ? new Date(booking.checkIn).toLocaleDateString("en-IN") : "N/A",
      checkOutDate: booking.checkOut ? new Date(booking.checkOut).toLocaleDateString("en-IN") : "N/A",
      bookingStatus: booking.bookingStatus,
      actualCheckInTime: booking.actualCheckInTime || "—",
      actualCheckOutTime: booking.actualCheckOutTime || "—"
    });

    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;