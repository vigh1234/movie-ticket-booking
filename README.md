# Movie Seat Booking System

A robust, concurrent-safe seat booking system for movie shows with real-time seat availability management.

## Features

### Core Functionality
- **Real-time seat availability** tracking
- **Concurrent booking** with distributed locking
- **Seat reservation** with automatic expiration (5 minutes)
- **Booking confirmation** and seat release mechanisms
- **Comprehensive statistics** for each show

### Concurrency Control
- **Distributed locks** using Redis to prevent race conditions
- **Atomic operations** for seat reservation and confirmation
- **Optimistic locking** at database level
- **Session-based seat holding** with auto-release

### Reliability Features
- **MongoDB** for persistent storage with TTL indexes
- **Redis** for caching and distributed locking
- **Atomic operations** using Lua scripts in Redis
- **Graceful shutdown** handling
- **Auto-expiration** of stale reservations

### User Experience
- **Real-time updates** of seat availability
- **Visual seat map** with color-coded status
- **Session timer** showing remaining reservation time
- **Clear error messages** for conflicts
- **Responsive design** for mobile and desktop

## System Architecture

### Components
1. **Express.js Server** - REST API backend
2. **MongoDB** - Primary data store for shows, seats, and sessions
3. **Redis** - Distributed locking and caching layer
4. **HTML/JavaScript Client** - Interactive frontend

### Data Models
- **Show** - Movie show metadata and total seats
- **Seat** - Individual seat status and booking information
- **BookingSession** - Temporary reservation sessions with TTL

### API Endpoints
- `POST /api/shows` - Create a new show
- `GET /api/shows/:showId` - Get show details
- `GET /api/shows/:showId/availability` - Get real-time seat availability
- `POST /api/shows/:showId/seats/reserve` - Reserve seats (with locking)
- `POST /api/shows/:showId/seats/confirm` - Confirm booking
- `POST /api/shows/:showId/seats/release` - Release reserved seats

## How It Handles Challenges

### 1. Concurrent Booking Attempts
- Uses **Redis distributed locks** to ensure only one booking operation per show at a time
- **Optimistic locking** in MongoDB prevents double-booking
- **Atomic seat updates** within locked sections

### 2. Incomplete Bookings
- Reservations automatically expire after **5 minutes** (MongoDB TTL index)
- **Background cleanup** of expired reservations
- **Manual release** option for users

### 3. Network Failures & Retries
- **Idempotent operations** wherever possible
- **Session-based tracking** ensures consistency
- **Clear error messages** for retry guidance

### 4. System Restarts
- **Persistent storage** in MongoDB ensures no data loss
- **Atomic transactions** prevent partial updates
- **Recovery scripts** can clean up inconsistent states

### 5. Scalability
- **Stateless API** design allows horizontal scaling
- **Redis-based locking** works across multiple instances
- **Cached availability** reduces database load

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- Redis (v6+)

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd movie-seat-booking
