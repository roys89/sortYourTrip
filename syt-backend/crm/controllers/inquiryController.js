const ItineraryInquiry = require('../../b2c/models/ItineraryInquiry'); // Fetch Inquiries now
const Itinerary = require('../../b2c/models/Itinerary'); // Still needed to check existence
// REMOVED User require here, not needed if we use req.body
// const User = require("../../b2c/models/User"); 
const mongoose = require("mongoose");

// --- Import B2C DB Connection Logic --- 
let b2cDbConnection = null;
const getB2CDatabaseConnection = async () => {
  if (b2cDbConnection && b2cDbConnection.readyState === 1) { 
    return b2cDbConnection;
  }
  try {
    console.log('Attempting to connect inquiryController to B2C database...');
    b2cDbConnection = await mongoose.createConnection(process.env.MONGO_URI_B2C || process.env.MONGO_URI, { 
      dbName: 'syt_b2c', 
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`inquiryController successfully connected to B2C database: syt_b2c`);
    b2cDbConnection.on('error', (err) => { console.error('B2C DB Connection Error (from inquiryController): ', err); b2cDbConnection = null; });
    b2cDbConnection.on('disconnected', () => { console.log('B2C DB Disconnected (from inquiryController)'); b2cDbConnection = null; });
    return b2cDbConnection;
  } catch (error) {
    console.error('FATAL: inquiryController failed to connect to B2C DB:', error);
    b2cDbConnection = null; 
    const err = new Error('Could not establish connection to B2C database.');
    err.statusCode = 503; 
    throw err; 
  }
};
// ------------------------------------

// Helper function to calculate total days from Inquiry dates
const calculateTotalDaysInquiry = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const difference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; 
    return difference > 0 ? difference : 0;
  } catch (e) {
    console.error("Error calculating inquiry days:", e);
    return 0;
  }
};

// Helper function to count travelers from Inquiry details
const countTravelersInquiry = (travelersDetails) => {
  if (!travelersDetails || !travelersDetails.rooms) return 0;
  return travelersDetails.rooms.reduce((total, room) => {
    const adultCount = Array.isArray(room.adults) ? room.adults.length : 0;
    const childCount = Array.isArray(room.children) ? room.children.length : 0;
    return total + adultCount + childCount;
  }, 0);
};

/**
 * @description Get itinerary inquiries based on user role for CRM view.
 * Also checks if a corresponding itinerary has been created.
 * @route GET /api/crm/inquiries/
 * @access Private (Requires authentication)
 */
exports.getCrmInquiries = async (req, res, next) => { // Added next
  try {
    const user = req.user; 
    if (!user || !user.id || !user.role) {
       // Use standard Error
      const err = new Error('Authentication required or user role missing.');
      err.statusCode = 401;
      return next(err); 
    }

    // Get B2C Connection
    const connection = await getB2CDatabaseConnection();
    const B2CItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquiry.schema);
    const B2CItineraryModel = connection.model('Itinerary', Itinerary.schema);

    // 1. Build Query for ItineraryInquiry based on role
    let inquiryQuery = {};
    if (user.role !== 'admin') {
      // Only return inquiries assigned to this agent
      inquiryQuery = { 'agents.agentId': user.id };
    }

    // 2. Fetch Inquiries
    const inquiries = await B2CItineraryInquiryModel.find(inquiryQuery)
                                          .sort({ createdAt: -1 })
                                          .lean();

    if (!inquiries || inquiries.length === 0) {
      return res.status(200).json([]); // Return empty array if no inquiries found
    }

    // 3. Check for existing Itineraries corresponding to these inquiries
    const inquiryTokens = inquiries.map(inq => inq.itineraryInquiryToken);
    const existingItineraries = await B2CItineraryModel.find({ inquiryToken: { $in: inquiryTokens } })
                                              .select('inquiryToken itineraryToken paymentStatus -_id') // Select paymentStatus
                                              .lean();
    
    // Create a Map for efficient lookup: { inquiryToken => { itineraryToken, paymentStatus } }
    const existingItineraryMap = new Map(existingItineraries.map(it => [
        it.inquiryToken, 
        { itineraryToken: it.itineraryToken, paymentStatus: it.paymentStatus } // Store object
    ]));

    // 4. Transform Inquiry data for frontend, adding itinerary existence info
    const transformedInquiries = inquiries.map(inq => {
        const citiesList = inq.selectedCities?.map(c => c.city) || [];
        const totalDays = calculateTotalDaysInquiry(inq.departureDates?.startDate, inq.departureDates?.endDate);
        const travelerCount = countTravelersInquiry(inq.travelersDetails);
        // Get the itinerary details object from the map
        const itineraryDetails = existingItineraryMap.get(inq.itineraryInquiryToken); 
        const correspondingItineraryToken = itineraryDetails?.itineraryToken || null;
        const paymentStatus = itineraryDetails?.paymentStatus || null; // Get payment status

        return {
          inquiryToken: inq.itineraryInquiryToken,
          customerName: inq.userInfo ? `${inq.userInfo.firstName || ''} ${inq.userInfo.lastName || ''}`.trim() : null,
          userId: inq.userInfo?.userId,
          agentName: (inq.agents && inq.agents.length > 0) ? inq.agents[0].agentName : null, // Assuming first agent
          agentId: (inq.agents && inq.agents.length > 0) ? inq.agents[0].agentId : null,
          status: 'Inquiry', // Maybe derive a status later if needed from Inquiry model
          createdAt: inq.createdAt,
          citiesList: citiesList,
          totalDays: totalDays,
          travelerCount: travelerCount,
          hasItinerary: !!correspondingItineraryToken, // Boolean flag
          itineraryToken: correspondingItineraryToken, // The actual token if it exists
          paymentStatus: paymentStatus // Add paymentStatus to the response
        };
    });

    res.status(200).json(transformedInquiries);

  } catch (error) {
    console.error('Error fetching CRM inquiries:', error);
    // Use next for error handling
    if (!error.statusCode) error.statusCode = 500; 
    next(error);
  }
};

// Updated function to use req.body directly and correct DB connection
exports.assignUserToInquiry = async (req, res, next) => { // Added next
    const { inquiryToken } = req.params;
    // Use the entire req.body as the user details payload
    const userDetailsPayload = req.body;

    // Validate the received payload minimally
    if (!userDetailsPayload || !userDetailsPayload.userId) {
        const err = new Error("User details (including userId) are required in the request body.");
        err.statusCode = 400;
        return next(err);
    }
    // Basic validation for userId format if needed
    // if (!mongoose.Types.ObjectId.isValid(userDetailsPayload.userId)) {
    //     return res.status(400).json({ message: "Invalid User ID format." });
    // }

    try {
        // Get B2C Connection
        const connection = await getB2CDatabaseConnection();
        const B2CItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquiry.schema);
        const B2CItineraryModel = connection.model('Itinerary', Itinerary.schema);

        // REMOVED: Redundant User lookup
        // const user = await User.findById(userId).select('_id firstName lastName email phoneNumber country countryCode dob');
        // if (!user) {
        //     return res.status(404).json({ message: "User not found." });
        // }

        // Prepare user info object DIRECTLY from the request body payload
        const userInfoPayloadForUpdate = {
            userId: userDetailsPayload.userId,
            firstName: userDetailsPayload.firstName,
            lastName: userDetailsPayload.lastName,
            email: userDetailsPayload.email,
            phoneNumber: userDetailsPayload.phoneNumber,
            country: userDetailsPayload.country,
            countryCode: userDetailsPayload.countryCode,
            dob: userDetailsPayload.dob,
        };
        
        console.log(`Assigning user to inquiry ${inquiryToken} using payload:`, userInfoPayloadForUpdate);

        // 2. Find and Update the Inquiry using the B2C Connection Model
        const inquiry = await B2CItineraryInquiryModel.findOne({ itineraryInquiryToken: inquiryToken }); // Use correct model
        if (!inquiry) {
             console.error(`Assign User Controller - Inquiry NOT FOUND in B2C DB for token: ${inquiryToken}`);
             const err = new Error("Itinerary Inquiry not found.");
             err.statusCode = 404;
             return next(err);
        }

        inquiry.userInfo = userInfoPayloadForUpdate;
        await inquiry.save();
        console.log(`Inquiry ${inquiryToken} updated successfully.`);

        // 3. Find and Update the corresponding Itinerary (if it exists) using B2C Connection Model
        const itinerary = await B2CItineraryModel.findOne({ inquiryToken }); // Use correct model
        if (itinerary) {
            // Prepare payload for itinerary (use required fields from request body)
            // Reconstructing the object to ensure all fields are included
            const itineraryUserInfoPayload = {
                 userId: userDetailsPayload.userId,
                 firstName: userDetailsPayload.firstName,
                 lastName: userDetailsPayload.lastName,
                 email: userDetailsPayload.email,
                 phoneNumber: userDetailsPayload.phoneNumber,
                 country: userDetailsPayload.country,      
                 countryCode: userDetailsPayload.countryCode, 
                 dob: userDetailsPayload.dob,              
            };
            console.log('Updating Itinerary userInfo with:', itineraryUserInfoPayload); // Log before assignment
            itinerary.userInfo = itineraryUserInfoPayload;
            await itinerary.save();
            console.log(`Associated Itinerary ${itinerary.itineraryToken} updated successfully.`);
        } else {
             console.log(`No associated Itinerary found for inquiry ${inquiryToken}.`);
        }

        // 4. Send Success Response
        res.status(200).json({ 
            message: "User assigned successfully to inquiry" + (itinerary ? " and associated itinerary." : "."),
            updatedInquiry: inquiry 
        });

    } catch (error) {
        console.error(`Error assigning user to inquiry ${inquiryToken}:`, error);
        // Use next for error handling
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}; 