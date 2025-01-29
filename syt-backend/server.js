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
const guestAllocationRoutes = require('./routes/guestAllocationRoutes');
const app = express();

// Increase payload size limit - Add these lines before other middleware
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

// Connect to database
connectDB();

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/cities-with-airports', cityAirportRoutes);
app.use("/api/itineraryInquiry", itineraryInquiryRoutes);
app.use("/api/itinerary", itineraryRoutes); 
app.use("/api/markup", markupRoutes); 
app.use("/api/booking/itinerary", itineraryBookingRoutes); 
app.use('/api/activities', activityRoutes);
app.use('/api/guest-allocation', guestAllocationRoutes);
// 404 route handler
app.use((req, res, next) => {
  res.status(404).send({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? '' : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;