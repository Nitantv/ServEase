const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingDate: {
    type: String, // "YYYY-MM-DD"
    required: true,
  },
  startTimeMinutes: {
    type: Number,
    required: true,
  },
  endTimeMinutes: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

// Create a compound index to prevent a worker from being double-booked for the same slot
bookingSchema.index({ workerId: 1, bookingDate: 1, startTimeMinutes: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);