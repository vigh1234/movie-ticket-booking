const mongoose = require('mongoose');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const BookingSession = require('../models/BookingSession');
const lockService = require('../services/lockService');
const cacheService = require('../services/cacheService');
const { v4: uuidv4 } = require('uuid');

class SeatController {
  
  async createShow(req, res) {
    try {
      const { movieTitle, showTime, totalSeats } = req.body;
      
      const show = new Show({
        movieTitle,
        showTime: new Date(showTime),
        totalSeats
      });
      
      await show.save();
      
      
      const seats = [];
      for (let i = 1; i <= totalSeats; i++) {
        seats.push({
          showId: show._id,
          seatNumber: `A${i}`,
          status: 'available'
        });
      }
      
      await Seat.insertMany(seats);
      
      res.status(201).json({
        success: true,
        showId: show._id,
        message: `Show created with ${totalSeats} seats`
      });
    } catch (error) {
      console.error('Error creating show:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  
  async getShowDetails(req, res) {
    try {
      const { showId } = req.params;
      
      const show = await Show.findById(showId);
      if (!show) {
        return res.status(404).json({ success: false, error: 'Show not found' });
      }
      
      const seats = await Seat.find({ showId });
      
      const stats = {
        total: seats.length,
        available: seats.filter(s => s.status === 'available').length,
        reserved: seats.filter(s => s.status === 'reserved').length,
        booked: seats.filter(s => s.status === 'booked').length
      };
      
      res.json({
        success: true,
        show,
        availability: stats,
        seats: seats.map(s => ({
          seatNumber: s.seatNumber,
          status: s.status
        }))
      });
    } catch (error) {
      console.error('Error getting show details:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }


  async reserveSeats(req, res) {
    const { showId } = req.params;
    const { seatNumbers, userId } = req.body;
    const sessionId = uuidv4();
    const lockKey = `lock:show:${showId}`;
    
    let lockAcquired = false;
    
    try {
      
      lockAcquired = await lockService.acquireLock(lockKey, sessionId, 5000);
      
      if (!lockAcquired) {
        return res.status(409).json({
          success: false,
          error: 'System busy. Please try again.'
        });
      }
      
      
      const seats = await Seat.find({
        showId,
        seatNumber: { $in: seatNumbers }
      });
      
      const unavailableSeats = seats.filter(seat => 
        seat.status !== 'available'
      );
      
      if (unavailableSeats.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Some seats are no longer available',
          unavailableSeats: unavailableSeats.map(s => s.seatNumber)
        });
      }
      
      
      const bookingSession = new BookingSession({
        showId,
        userId,
        seatNumbers,
        status: 'reserved',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) 
      });
      
      await bookingSession.save();
      
      
      await Seat.updateMany(
        {
          showId,
          seatNumber: { $in: seatNumbers }
        },
        {
          $set: {
            status: 'reserved',
            bookingSessionId: bookingSession.sessionId,
            userId,
            reservedAt: new Date()
          }
        }
      );
      
     
      await cacheService.del(`availability:${showId}`);
      
      res.json({
        success: true,
        sessionId: bookingSession.sessionId,
        message: 'Seats reserved for 5 minutes',
        expiresAt: bookingSession.expiresAt
      });
      
    } catch (error) {
      console.error('Error reserving seats:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      
      if (lockAcquired) {
        await lockService.releaseLock(lockKey, sessionId);
      }
    }
  }

  
  async confirmBooking(req, res) {
    const { showId } = req.params;
    const { sessionId } = req.body;
    const lockKey = `lock:session:${sessionId}`;
    
    let lockAcquired = false;
    
    try {
      lockAcquired = await lockService.acquireLock(lockKey, 'confirm', 3000);
      
      if (!lockAcquired) {
        return res.status(409).json({
          success: false,
          error: 'Could not process booking. Please try again.'
        });
      }
      
      
      const bookingSession = await BookingSession.findOne({
        sessionId,
        status: 'reserved',
        expiresAt: { $gt: new Date() }
      });
      
      if (!bookingSession) {
        return res.status(404).json({
          success: false,
          error: 'Booking session expired or not found'
        });
      }
      
     
      bookingSession.status = 'confirmed';
      bookingSession.confirmedAt = new Date();
      await bookingSession.save();
      
     
      await Seat.updateMany(
        {
          showId,
          seatNumber: { $in: bookingSession.seatNumbers },
          bookingSessionId: sessionId
        },
        {
          $set: {
            status: 'booked',
            bookedAt: new Date()
          }
        }
      );
      
      
      await cacheService.del(`availability:${showId}`);
      
      res.json({
        success: true,
        message: 'Booking confirmed successfully',
        bookingId: bookingSession._id
      });
      
    } catch (error) {
      console.error('Error confirming booking:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (lockAcquired) {
        await lockService.releaseLock(lockKey, 'confirm');
      }
    }
  }

  
  async releaseSeats(req, res) {
    const { showId } = req.params;
    const { sessionId } = req.body;
    
    try {
      const bookingSession = await BookingSession.findOne({ sessionId });
      
      if (bookingSession && bookingSession.status === 'reserved') {
        bookingSession.status = 'cancelled';
        await bookingSession.save();
        
        
        await Seat.updateMany(
          {
            showId,
            seatNumber: { $in: bookingSession.seatNumbers },
            bookingSessionId: sessionId,
            status: 'reserved'
          },
          {
            $set: {
              status: 'available',
              bookingSessionId: null,
              userId: null,
              reservedAt: null
            }
          }
        );
        
        
        await cacheService.del(`availability:${showId}`);
      }
      
      res.json({
        success: true,
        message: 'Seats released successfully'
      });
      
    } catch (error) {
      console.error('Error releasing seats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAvailability(req, res) {
    try {
      const { showId } = req.params;
      
      
      const cached = await cacheService.get(`availability:${showId}`);
      if (cached) {
        return res.json(cached);
      }
      
     
      const seats = await Seat.find({ showId });
      
      const stats = {
        available: seats.filter(s => s.status === 'available').length,
        reserved: seats.filter(s => s.status === 'reserved').length,
        booked: seats.filter(s => s.status === 'booked').length,
        total: seats.length,
        timestamp: new Date().toISOString()
      };
      
     
      await cacheService.set(`availability:${showId}`, stats, 5);
      
      res.json(stats);
      
    } catch (error) {
      console.error('Error getting availability:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SeatController();