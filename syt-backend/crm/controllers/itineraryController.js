const mongoose = require('mongoose');
const Itinerary = require('../../b2c/models/Itinerary'); // CORRECT Itinerary model
const ItineraryBooking = require('../../b2c/models/ItineraryBooking'); // Needed for delete check
const Payment = require('../../b2c/models/Payment'); // Needed for payment details

// --- Internal B2C DB Connection Logic (copied from inquiryController.js pattern) ---
let b2cDbConnection = null;
const getB2CDatabaseConnection = async () => {
  if (b2cDbConnection && b2cDbConnection.readyState === 1) {
    return b2cDbConnection;
  }
  try {
    console.log('CRM Itinerary Controller: Attempting to connect to B2C database...');
    // Use environment variables for connection string and DB name
    const dbUri = process.env.MONGO_URI_B2C || process.env.MONGO_URI;
    const dbName = process.env.B2C_DB_NAME || 'syt_b2c'; // Use env var or default

    if (!dbUri) {
        throw new Error('B2C Database connection string not found in environment variables.');
    }

    b2cDbConnection = await mongoose.createConnection(dbUri, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`CRM Itinerary Controller: Successfully connected to B2C database: ${dbName}`);
    b2cDbConnection.on('error', (err) => { console.error('B2C DB Connection Error (from CRM Itinerary Controller): ', err); b2cDbConnection = null; });
    b2cDbConnection.on('disconnected', () => { console.warn('B2C DB Disconnected (from CRM Itinerary Controller)'); b2cDbConnection = null; });
    return b2cDbConnection;
  } catch (error) {
    console.error('FATAL: CRM Itinerary Controller failed to connect to B2C DB:', error);
    b2cDbConnection = null;
    const err = new Error('Could not establish connection to B2C database.');
    err.statusCode = 503; // Service Unavailable
    throw err; // Rethrow to be caught by the route handler
  }
};
// ------------------------------------

// @desc    Get all itineraries
// @route   GET /api/crm/itineraries
// @access  Private (Requires auth)
const getAllItineraries = async (req, res, next) => {
    // console.log(`CRM: Attempting to fetch all itineraries by user ${req.user?.id} (${req.user?.role})`);
    try {
        // Check if user is authenticated
        const user = req.user;
        if (!user || !user.id || !user.role) {
            return res.status(401).json({ success: false, message: 'Authentication required or user role missing.' });
        }

        // Get B2C DB Connection using the internal function
        const connection = await getB2CDatabaseConnection();

        // Get Models scoped to this connection
        const ItineraryModel = connection.model('Itinerary', Itinerary.schema);
        const ItineraryBookingModel = connection.model('ItineraryBooking', ItineraryBooking.schema);
        const PaymentModel = connection.model('Payment', Payment.schema);

        // Set query based on user role
        let query = {};
        if (user.role !== 'admin') {
            // Only return itineraries assigned to this agent
            query = { 'agents.agentId': user.id };
        }

        // Find all documents in the Itinerary collection with the query filter
        const itineraries = await ItineraryModel.find(query)
        .select( // Select necessary fields
            'itineraryToken ' +
            'inquiryToken ' +
            'userInfo ' +
            'agents ' +
            'paymentStatus ' +
            'createdAt ' +
            'cities.city ' +
            'cities.startDate ' +
            'cities.days'
        )
        .sort({ createdAt: -1 })
        .lean();

        if (!itineraries || itineraries.length === 0) {
            console.log('CRM: No itineraries found in B2C DB.');
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // --- Fetch related data efficiently ---
        const itineraryTokens = itineraries.map(it => it.itineraryToken);

        // Fetch related bookings
        const bookings = await ItineraryBookingModel.find({ itineraryToken: { $in: itineraryTokens } })
            .select('itineraryToken status bookingId paymentId') // Select needed fields
            .lean();

        // Fetch related completed payments (use bookingId if available, else itineraryToken as fallback)
        // Note: This assumes Payment might be linked via bookingId OR itineraryToken+inquiryToken
        const bookingIds = bookings.map(b => b.bookingId).filter(Boolean);
        const paymentQueryCriteria = [
            { bookingId: { $in: bookingIds } }, // Primary link: bookingId from ItineraryBooking
            { itineraryToken: { $in: itineraryTokens }, status: 'completed' } // Fallback/Direct link: itineraryToken for completed payments
        ];
        const payments = await PaymentModel.find({ $or: paymentQueryCriteria, status: 'completed' })
            .select('itineraryToken bookingId paymentId _id') // Select needed fields including _id for paymentId
            .lean();

        // Create lookup maps for faster access
        const bookingMap = bookings.reduce((map, booking) => {
            map[booking.itineraryToken] = booking;
            return map;
        }, {});

        const paymentMap = payments.reduce((map, payment) => {
            // Prioritize mapping by bookingId if it exists, otherwise use itineraryToken
            const key = payment.bookingId || payment.itineraryToken;
            if (key) {
                map[key] = payment;
            }
            return map;
        }, {});
        // --- End Fetch related data ---

        // Format the data for the frontend, now including booking and payment details
        const formattedItineraries = itineraries.map(itinerary => {
            let startDate = null;
            let totalDays = 0;
            if (itinerary.cities && itinerary.cities.length > 0) {
                 const startDates = itinerary.cities.map(c => c.startDate).filter(Boolean);
                 if (startDates.length > 0) {
                     startDate = new Date(Math.min(...startDates.map(date => new Date(date))));
                 }
                 totalDays = itinerary.cities.reduce((sum, city) => sum + (city.days?.length || 0), 0);
            }
            const primaryAgent = itinerary.agents?.[0];

            // Get related booking and payment info
            const bookingInfo = bookingMap[itinerary.itineraryToken];
            // Try finding payment by bookingId first, then by itineraryToken as fallback
            const paymentInfo = bookingInfo?.bookingId ? paymentMap[bookingInfo.bookingId] : paymentMap[itinerary.itineraryToken];

            const bookingStatusInfo = {};
            if (bookingInfo) {
                bookingStatusInfo.bookingStatus = bookingInfo.status;
                // Only include bookingId if status is relevant
                if (['processing', 'confirmed', 'cancelled', 'failed'].includes(bookingInfo.status)) {
                    bookingStatusInfo.bookingId = bookingInfo.bookingId;
                }
            }

            const paymentIdInfo = {};
            if (itinerary.paymentStatus === 'completed' && paymentInfo) {
                 // Use payment._id as the paymentId to show on frontend
                paymentIdInfo.paymentId = paymentInfo._id?.toString();
            } else if (itinerary.paymentStatus === 'completed' && bookingInfo?.paymentId) {
                 // Fallback to paymentId stored directly on booking if Payment record lookup failed but status is completed
                 paymentIdInfo.paymentId = bookingInfo.paymentId.toString();
            }

            return {
                 clientName: itinerary.userInfo ? `${itinerary.userInfo.firstName || ''} ${itinerary.userInfo.lastName || ''}`.trim() : 'N/A',
                 clientEmail: itinerary.userInfo?.email,
                 itineraryToken: itinerary.itineraryToken,
                 inquiryToken: itinerary.inquiryToken,
                 paymentStatus: itinerary.paymentStatus || 'Unknown',
                 totalDays: totalDays,
                 startDate: startDate ? startDate.toISOString().split('T')[0] : null,
                 assignedTo: primaryAgent ? { id: primaryAgent.agentId, name: primaryAgent.agentName } : null,
                 createdAt: itinerary.createdAt,
                 ...bookingStatusInfo, // Add bookingStatus and bookingId if available
                 ...paymentIdInfo,    // Add paymentId if available
            };
        });

        // console.log(`CRM: Successfully fetched ${formattedItineraries.length} itineraries with booking/payment details.`);
        res.status(200).json({ success: true, count: formattedItineraries.length, data: formattedItineraries });

    } catch (error) {
        // Log the error including user info for context
        console.error(`CRM: Error fetching all itineraries: ${error.message}`, { stack: error.stack, userId: req.user?.id });
        // Ensure status code is set before passing to error handler
        if (!error.statusCode) error.statusCode = 500;
        next(error); // Pass error to the global Express error handler
    }
};

// *** NEW: Delete Itinerary (CRM Controller) ***
const deleteItinerary = async (req, res, next) => {
    const { itineraryToken } = req.params;
    const user = req.user; // CRM user performing the action

    // Authorization: Only admin/manager can delete for now (CRM roles)
    if (!['admin', 'manager'].includes(user.role)) {
        const err = new Error('Not authorized to delete itineraries.');
        err.statusCode = 403; // Forbidden
        return next(err);
    }

    if (!itineraryToken) {
        const err = new Error('Itinerary token is required for deletion.');
        err.statusCode = 400;
        return next(err);
    }

    try {
        // Get B2C Connection for deleting
        const connection = await getB2CDatabaseConnection();
        const B2CItineraryModel = connection.model('Itinerary', Itinerary.schema);
        const B2CItineraryBookingModel = connection.model('ItineraryBooking', ItineraryBooking.schema);

        // Check if a corresponding B2C ItineraryBooking exists
        const existingBooking = await B2CItineraryBookingModel.findOne({ itineraryToken }).select('_id').lean();
        if (existingBooking) {
            const err = new Error('Cannot delete itinerary: Corresponding booking exists in B2C DB.');
            err.statusCode = 400; // Bad Request
            return next(err);
        }

        // Delete the itinerary from B2C DB
        const result = await B2CItineraryModel.deleteOne({ itineraryToken: itineraryToken });

        if (result.deletedCount === 0) {
            const err = new Error('Itinerary not found in B2C database for deletion.');
            err.statusCode = 404;
            return next(err);
        }

        console.log(`CRM Controller: Itinerary ${itineraryToken} deleted from B2C DB by CRM user ${user.id}`);
        res.status(200).json({ success: true, message: 'Itinerary deleted successfully.' });

    } catch (error) {
        console.error(`CRM Controller: Error deleting itinerary ${itineraryToken}:`, error);
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

module.exports = {
    getAllItineraries,
    deleteItinerary, // Export new function
};