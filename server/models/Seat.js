const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true,
    index: true
  },
  seatNumber: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'booked'],
    default: 'available',
    index: true
  },
  bookingSessionId: {
    type: String,
    default: null,
    index: true
  },
  reservedAt: {
    type: Date,
    default: null
  },
  bookedAt: {
    type: Date,
    default: null
  },
  userId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});


seatSchema.index({ showId: 1, seatNumber: 1 }, { unique: true });


seatSchema.index({ reservedAt: 1 }, { 
  expireAfterSeconds: 300,
  partialFilterExpression: { status: 'reserved' }
});

module.exports = mongoose.model('Seat', seatSchema);