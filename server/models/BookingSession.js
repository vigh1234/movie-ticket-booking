const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  seatNumbers: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['reserved', 'confirmed', 'expired', 'cancelled'],
    default: 'reserved',
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000), 
    index: { expireAfterSeconds: 0 }
  },
  confirmedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BookingSession', bookingSessionSchema);