const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['Deluxe', 'Executive', 'Suite', 'Standard'], default: 'Deluxe' },
  pricePerNight: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Occupied', 'Cleaning'], default: 'Available' },
  amenities: [String],
  image: { type: String, default: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
