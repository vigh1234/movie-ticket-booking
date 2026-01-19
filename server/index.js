const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const seatController = require('./controllers/seatController');

const app = express();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '../client')));


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie_booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});


app.post('/api/shows/:showId/seats/reserve', seatController.reserveSeats);
app.post('/api/shows/:showId/seats/confirm', seatController.confirmBooking);
app.post('/api/shows/:showId/seats/release', seatController.releaseSeats);
app.get('/api/shows/:showId/availability', seatController.getAvailability);
app.post('/api/shows', seatController.createShow);
app.get('/api/shows/:showId', seatController.getShowDetails);


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongo: db.readyState === 1 ? 'connected' : 'disconnected'
  });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});


app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` API available at http://localhost:${PORT}/api`);
  console.log(` Client available at http://localhost:${PORT}`);
});


process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing connections...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});