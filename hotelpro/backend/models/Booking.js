const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalNights: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  bookingStatus: { type: String, enum: ['Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'], default: 'Confirmed' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
