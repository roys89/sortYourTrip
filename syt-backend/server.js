const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const countryRoutes = require('./routes/countryRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const cityAirportRoutes = require('./routes/cityAirportRoutes');
const itineraryInquiryRoutes = require("./routes/itineraryInquiryRoutes");
const itineraryRoutes = require('./routes/itineraryRoutes/itineraryRoutes');
const itineraryBookingRoutes = require('./routes/itineraryRoutes/itineraryBookingRoutes');
const markupRoutes = require('./routes/markupRoutes');
const activityRoutes = require('./routes/activityRoutes');
const flightRoutes = require('./routes/itineraryRoutes/flightRoutes');
const hotelRoutes = require('./routes/itineraryRoutes/hotelRoutes');
const guestAllocationRoutes = require('./routes/guestAllocationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const lockRoutes = require('./routes/lockRoutes'); // Add lock routes
const lockCleanup = require('./jobs/lockCleanup'); // Add lock cleanup job

const app = express();

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use('/api/auth', limiter);

// Connect to database and start lock cleanup job
connectDB().then(() => {
  console.log('Connected to MongoDB');
  // Start the lock cleanup job after successful DB connection
  lockCleanup.schedule();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/cities-with-airports', cityAirportRoutes);
app.use("/api/itineraryInquiry", itineraryInquiryRoutes);
app.use("/api/itinerary", itineraryRoutes); 
app.use("/api/markup", markupRoutes); 
app.use("/api/booking", itineraryBookingRoutes); 
app.use('/api/activities', activityRoutes);
app.use('/api/guest-allocation', guestAllocationRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/payment', paymentRoutes);

// Add lock routes - Important to add after itinerary routes
// since locks are related to itineraries
app.use('/api', lockRoutes);

// 404 route handler
app.use((req, res, next) => {
  res.status(404).send({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Special handling for lock-related errors
  if (err.name === 'LockError') {
    return res.status(409).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  res.status(err.status || 500).send({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? '' : err.stack,
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  
  try {
    // Clean up any active locks before shutting down
    const Lock = require('./models/Lock');
    await Lock.updateMany(
      { status: 'active' },
      { $set: { status: 'expired' } }
    );
    
    console.log('Active locks cleaned up.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;