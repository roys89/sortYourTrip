const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// B2C Database Connection
const connectDB = require('./b2c/config/db');

// B2C Routes
const authRoutes = require('./b2c/routes/authRoutes');
const countryRoutes = require('./shared/routes/countryRoutes');
const destinationRoutes = require('./shared/routes/destinationRoutes');
const cityAirportRoutes = require('./shared/routes/cityAirportRoutes');
const itineraryInquiryRoutes = require("./b2c/routes/itineraryInquiryRoutes");
const itineraryRoutes = require('./b2c/routes/itineraryRoutes/itineraryRoutes');
const itineraryBookingRoutes = require('./b2c/routes/itineraryRoutes/itineraryBookingRoutes');
const markupRoutes = require('./b2c/routes/markupRoutes');
const activityRoutes = require('./shared/routes/activityRoutes');
const flightRoutes = require('./b2c/routes/itineraryRoutes/flightRoutes');
const hotelRoutes = require('./b2c/routes/itineraryRoutes/hotelRoutes');
const guestAllocationRoutes = require('./b2c/routes/guestAllocationRoutes');
const paymentRoutes = require('./b2c/routes/paymentRoutes');
const voucherRoutes = require('./b2c/routes/itineraryRoutes/voucherRoutes');
const tripAdvisorRoutes = require('./shared/routes/TripAdvisorRoutes');

// CRM Database Connection
const connectCRMDB = require('./crm/config/db');

// CRM Routes
const crmAuthRoutes = require('./crm/routes/authRoutes');
const crmUserRoutes = require('./crm/routes/userRoutes');
const crmLeadRoutes = require('./crm/routes/leadRoutes');
const crmFlightRoutes = require('./crm/routes/flightRoutes');
const crmTransferRoutes = require('./crm/routes/transferRoutes');
const crmActivityRoutes = require('./crm/routes/activityRoutes');
const crmHotelRoutes = require('./crm/routes/hotelRoutes');

// CRM Initialization
const initCRM = require('./crm/index');

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
app.use('/api/crm/auth', limiter);

// Connect to databases
connectDB(); // B2C Database
connectCRMDB(); // CRM Database

// Initialize CRM system
initCRM();

// Use B2C routes
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
app.use('/api/flights', flightRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/voucher', voucherRoutes);
app.use('/api/tripadvisor', tripAdvisorRoutes);

// Use CRM routes
app.use('/api/crm/auth', crmAuthRoutes);
app.use('/api/crm/users', crmUserRoutes);
app.use('/api/crm/leads', crmLeadRoutes);
app.use('/api/crm/bookings/flight', crmFlightRoutes);
app.use('/api/crm/bookings/transfer', crmTransferRoutes);
app.use('/api/crm/bookings/activity', crmActivityRoutes);
app.use('/api/crm/bookings/hotel', crmHotelRoutes);

// Serve static assets for CRM frontend in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder for CRM
  app.use('/crm', express.static(path.join(__dirname, 'syt-frontend-crm/build')));

  app.get('/crm/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'syt-frontend-crm/build', 'index.html'));
  });
}

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