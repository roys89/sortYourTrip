const mongoose = require('mongoose');
const Itinerary = require('../../b2c/models/Itinerary'); // CORRECT Itinerary model

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
        // Get B2C DB Connection using the internal function
        const connection = await getB2CDatabaseConnection();

        // Get the Itinerary model scoped to this connection
        const ItineraryModel = connection.model('Itinerary', Itinerary.schema);

        // Find all documents in the Itinerary collection
        const itineraries = await ItineraryModel.find({})
        .select( // Select necessary fields, MINIMIZING data from cities array
            'itineraryToken ' +
            'inquiryToken ' +
            'userInfo ' +
            'agents ' +
            'paymentStatus ' +
            'createdAt ' +
            'cities.city ' +         // Only get city names
            'cities.startDate ' +    // Only get city start dates
            'cities.days'            // Need this (or its length) for totalDays calc
        )
        .sort({ createdAt: -1 })
        .lean();

        if (!itineraries || itineraries.length === 0) {
            console.log('CRM: No itineraries found in B2C DB.');
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // Format the data for the frontend (same logic as before)
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

            return {
                 clientName: itinerary.userInfo ? `${itinerary.userInfo.firstName || ''} ${itinerary.userInfo.lastName || ''}`.trim() : 'N/A',
                 clientEmail: itinerary.userInfo?.email,
                 itineraryToken: itinerary.itineraryToken,
                 inquiryToken: itinerary.inquiryToken,
                 status: itinerary.paymentStatus || 'Unknown',
                 totalDays: totalDays,
                 startDate: startDate ? startDate.toISOString().split('T')[0] : null,
                 assignedTo: primaryAgent ? { id: primaryAgent.agentId, name: primaryAgent.agentName } : null,
                 createdAt: itinerary.createdAt
            };
        });

        // console.log(`CRM: Successfully fetched ${formattedItineraries.length} itineraries.`);
        res.status(200).json({ success: true, count: formattedItineraries.length, data: formattedItineraries });

    } catch (error) {
        // Log the error including user info for context
        console.error(`CRM: Error fetching all itineraries: ${error.message}`, { stack: error.stack, userId: req.user?.id });
        // Ensure status code is set before passing to error handler
        if (!error.statusCode) error.statusCode = 500;
        next(error); // Pass error to the global Express error handler
    }
};

module.exports = {
    getAllItineraries,
};