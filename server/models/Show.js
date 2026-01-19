const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movieTitle: {
    type: String,
    required: true,
    trim: true
  },
  showTime: {
    type: Date,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


showSchema.index({ showTime: 1 });
showSchema.index({ movieTitle: 1, showTime: 1 });

module.exports = mongoose.model('Show', showSchema);