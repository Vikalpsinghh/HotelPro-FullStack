const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let rooms = [
  { _id: '1', roomNumber: '101', title: 'Grand Ocean King Suite', type: 'Suite', pricePerNight: 280, capacity: 2, status: 'Available', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80' },
  { _id: '2', roomNumber: '102', title: 'Executive Deluxe Cityscape', type: 'Executive', pricePerNight: 195, capacity: 2, status: 'Available', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80' },
  { _id: '3', roomNumber: '201', title: 'Garden Terrace Twin Villa', type: 'Deluxe', pricePerNight: 150, capacity: 4, status: 'Available', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80' },
  { _id: '4', roomNumber: '202', title: 'Classic Comfort Single', type: 'Standard', pricePerNight: 95, capacity: 1, status: 'Available', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80' }
];

let bookings = [];

app.get('/api/rooms', (req, res) => res.json(rooms));

app.patch('/api/rooms/:id/status', (req, res) => {
  const room = rooms.find(r => r._id === req.params.id);
  if (room) room.status = req.body.status;
  res.json(room);
});

app.get('/api/bookings', (req, res) => res.json(bookings));

app.post('/api/bookings', (req, res) => {
  const newBooking = {
    _id: Date.now().toString(),
    ...req.body,
    bookingStatus: 'Confirmed',
    actualCheckInTime: null,
    actualCheckOutTime: null,
    roomId: rooms.find(r => r._id === req.body.roomId)
  };
  bookings.unshift(newBooking);
  res.status(201).json(newBooking);
});

app.patch('/api/bookings/:id/status', (req, res) => {
  const booking = bookings.find(b => b._id === req.params.id);
  if (booking) {
    booking.bookingStatus = req.body.bookingStatus;
    if (req.body.actualCheckInTime) {
      booking.actualCheckInTime = req.body.actualCheckInTime;
    }
    if (req.body.actualCheckOutTime) {
      booking.actualCheckOutTime = req.body.actualCheckOutTime;
    }

    const room = rooms.find(r => r._id === booking.roomId?._id);
    if (room) {
      if (req.body.bookingStatus === 'Checked-In') room.status = 'Occupied';
      if (req.body.bookingStatus === 'Checked-Out') room.status = 'Cleaning';
      if (req.body.bookingStatus === 'Cancelled') room.status = 'Available';
    }
  }
  res.json(booking);
});

app.get('/api/seed', (req, res) => {
  res.send({ message: 'Seed data loaded successfully!' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));