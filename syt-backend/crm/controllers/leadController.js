// crm/controllers/leadController.js
const { getModels } = require('../models/Index'); // Import getModels instead of Lead directly
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');

// --- B2C Database Connection Management ---
let b2cDbConnection = null;

const getB2CDatabaseConnection = async () => {
  if (b2cDbConnection && b2cDbConnection.readyState === 1) {
    return b2cDbConnection;
  }
  try {
    console.log('Attempting to connect leadController to B2C database...');
    b2cDbConnection = await mongoose.createConnection(process.env.MONGO_URI_B2C || process.env.MONGO_URI, { 
      dbName: 'syt_b2c', 
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`leadController successfully connected to B2C database: syt_b2c`);
    b2cDbConnection.on('error', (err) => {
      console.error('B2C DB Connection Error (from leadController): ', err);
      b2cDbConnection = null; 
    });
    b2cDbConnection.on('disconnected', () => {
      console.log('B2C DB Disconnected (from leadController)');
      b2cDbConnection = null; 
    });
    return b2cDbConnection;
  } catch (error) {
    console.error('FATAL: leadController failed to connect to B2C DB:', error);
    b2cDbConnection = null; 
    const err = new Error('Could not establish connection to B2C database.');
    err.statusCode = 503;
    throw err; 
  }
};
// ---------------------------------------------

// @desc    Get all leads
// @route   GET /api/crm/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const { Lead } = getModels(); 
    const user = req.user; // Get the authenticated user
    
    // ** MODIFIED: Build query with filters and search **
    let queryFilter = {};
    const { status, leadType, assignedTo, startDate, endDate, search } = req.query;

    // Basic Filters
    if (status) queryFilter.status = status;
    if (leadType) queryFilter.leadType = leadType;
    if (assignedTo) queryFilter.assignedTo = assignedTo; // Assumes assignedTo is passed as ObjectId string

    // Date Range Filter (on createdAt)
    if (startDate || endDate) {
      queryFilter.createdAt = {};
      if (startDate) queryFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryFilter.createdAt.$lte = endOfDay;
      }
    }

    // Search Filter (Name, Email)
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive regex
      queryFilter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
      // Note: Searching by assignedTo employeeId requires a more complex lookup/aggregation
    }
    
    // Role-Based Filtering (Keep existing logic)
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      queryFilter.assignedTo = user.id; 
    }
    // ** END MODIFICATION **
    
    // Finding resource using the combined filter
    let query = Lead.find(queryFilter);
    
    // Select Fields (Keep existing logic, ensure status is selected)
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields + ' status'); // Ensure status is included if select is used
    } else {
       query = query.select('-__v'); // Default select excluding __v
    }
    
    // Sort (Keep existing logic)
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination (Keep existing logic, use final queryFilter for count)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Lead.countDocuments(queryFilter); 
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query - ensure assignedTo is populated (include employeeId)
    const leads = await query.populate({
      path: 'assignedTo',
      select: 'name email employeeId' // Keep employeeId
    });
    
    // Pagination result (Keep existing logic)
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }
    
    res.status(200).json({
      success: true,
      count: leads.length,
      total: total, // Add total count for pagination info
      pagination,
      data: leads
    });
  } catch (error) {
    console.error('Error in getLeads:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single lead
// @route   GET /api/crm/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const { Lead } = getModels();
    
    // Fetch the lead and populate assignedTo
    let lead = await Lead.findById(req.params.id).populate({
      path: 'assignedTo',
      select: 'name email'
    });
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // *** Enhance if it's a website lead ***
    let enhancedLeadData = lead.toObject(); // Convert to plain object for modification

    if (lead.leadType === 'website' && lead.user) {
      try {
        const b2cUserId = lead.user.toString();
        const connection = await getB2CDatabaseConnection();
        
        // Import B2C models dynamically within the check
        const ItineraryInquirySchema = require('../../b2c/models/ItineraryInquiry').schema;
        const ItinerarySchema = require('../../b2c/models/Itinerary').schema;
        const ItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquirySchema);
        const ItineraryModel = connection.model('Itinerary', ItinerarySchema);
        
        // Fetch inquiries with more details
        const inquiries = await ItineraryInquiryModel.find({ 'userInfo.userId': b2cUserId })
          .select(
            'itineraryInquiryToken createdAt selectedCities departureCity departureDates travelersDetails preferences agents' // Added fields
          )
          .sort('-createdAt')
          .lean();

        // Fetch itineraries with more details
        const itineraries = await ItineraryModel.find({ 'userInfo.userId': b2cUserId })
          .select(
            'itineraryToken inquiryToken itineraryTitle destinations departureDate returnDate numberOfTravelers status totalAmount currency createdAt agents' // Added fields
          )
          .sort('-createdAt')
          .lean();

        // Add fetched data to the lead object with detailed mapping
        enhancedLeadData.inquiries = inquiries.map(inq => {
            // Calculate total travelers from rooms array
            let totalAdults = 0;
            let totalChildren = 0;
            if (Array.isArray(inq.travelersDetails?.rooms)) {
              inq.travelersDetails.rooms.forEach(room => {
                totalAdults += Array.isArray(room.adults) ? room.adults.length : 0;
                totalChildren += Array.isArray(room.children) ? room.children.length : 0;
              });
            }
            let totalTravelers = totalAdults + totalChildren;

            return {
              inquiryToken: inq.itineraryInquiryToken,
              createdAt: inq.createdAt,
              agentName: inq.agents?.[0]?.agentName || 'Unassigned',
              destinations: inq.selectedCities?.map(city => city.city).join(', ') || 'N/A',
              departureCity: inq.departureCity?.name || 'N/A',
              startDate: inq.departureDates?.startDate,
              endDate: inq.departureDates?.endDate,
              travelers: totalTravelers, // Use calculated value
              adults: totalAdults,       // Use calculated value
              children: totalChildren,   // Use calculated value
              // Keep original rooms data if needed for other purposes, but display count on frontend
              rooms: inq.travelersDetails?.rooms || [], 
              interests: inq.preferences?.selectedInterests?.join(', ') || 'N/A',
              // Use budget string directly as per schema
              budget: inq.preferences?.budget || 'N/A', 
            };
        }) || [];

        enhancedLeadData.itineraries = itineraries.map(itin => ({
          itineraryToken: itin.itineraryToken,
          inquiryToken: itin.inquiryToken, // Link back to inquiry if exists
          title: itin.itineraryTitle || 'N/A',
          createdAt: itin.createdAt,
          agentName: itin.agents?.[0]?.agentName || 'Unassigned',
          status: itin.status || 'Pending', // Use itinerary status
          destinations: itin.destinations?.map(dest => dest.city?.name).join(', ') || 'N/A', // Assuming destinations array has city objects
          departureDate: itin.departureDate,
          returnDate: itin.returnDate,
          travelers: itin.numberOfTravelers || 'N/A',
          price: itin.totalAmount ? `${itin.totalAmount} ${itin.currency || ''}`.trim() : 'N/A',
        })) || [];

        // Optionally, fetch and add B2C user details if needed
        // const B2CUserSchema = require('../../b2c/models/User').schema;
        // const B2CUserModel = connection.model('User', B2CUserSchema);
        // const b2cUser = await B2CUserModel.findById(b2cUserId).select('fullName country ...').lean();
        // if (b2cUser) { enhancedLeadData.b2cDetails = b2cUser; }

      } catch (b2cError) {
        console.error("Error fetching B2C data for lead:", b2cError);
        // Decide if you want to fail the request or just return the CRM lead data
        // For now, let's add empty arrays but log the error
        enhancedLeadData.inquiries = [];
        enhancedLeadData.itineraries = [];
      }
    } else {
      // Ensure these fields exist even for non-website leads
      if (!enhancedLeadData.inquiries) enhancedLeadData.inquiries = [];
      if (!enhancedLeadData.itineraries) enhancedLeadData.itineraries = [];
    }
    
    // Return the (potentially enhanced) lead data
    res.status(200).json({ success: true, data: enhancedLeadData });

  } catch (error) {
    console.error('Error in getLead:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create lead
// @route   POST /api/crm/leads
// @access  Private
exports.createLead = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const { Lead } = getModels();
    
    // Add user to req.body
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user.id;
    }
    
    const lead = await Lead.create(req.body);
    
    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update lead
// @route   PUT /api/crm/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    const { Lead } = getModels();
    
    let lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Make sure user is lead owner or admin
    if (lead.assignedTo && lead.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: `Not authorized to update this lead` });
    }
    
    // Update the updatedAt field
    req.body.updatedAt = Date.now();
    
    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete lead
// @route   DELETE /api/crm/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const { Lead } = getModels();
    
    // Find the lead and populate assignedTo BEFORE deleting
    const lead = await Lead.findById(req.params.id).populate('assignedTo', '_id'); 
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Make sure user is lead owner or admin
    if (lead.assignedTo && lead.assignedTo._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: `Not authorized to delete this lead` });
    }
    
    // Remove agent from B2C records BEFORE deleting CRM lead
    if (lead.leadType === 'website' && lead.user && lead.assignedTo) {
      try {
        await removeAgentFromB2CRecords(lead.user.toString(), lead.assignedTo._id);
      } catch (b2cError) {
        // Log the error but allow CRM deletion to proceed
        console.error(`Non-fatal error during B2C agent removal for lead ${lead._id}:`, b2cError);
      }
    }
    
    // Proceed with deleting CRM lead
    await lead.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(`Error in deleteLead for ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete multiple leads
// @route   DELETE /api/crm/leads/multiple
// @access  Private
exports.deleteMultipleLeads = async (req, res) => {
  try {
    const { Lead } = getModels();
    
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of lead IDs' });
    }
    
    // Find all leads to get details before deleting
    const leads = await Lead.find({ _id: { $in: ids } }).populate('assignedTo', '_id');
    
    // Basic check if leads were found matching IDs
    if (!leads) {
       console.error('Lead.find returned null/undefined during multi-delete!');
       return res.status(500).json({ success: false, message: 'Error fetching leads for deletion.' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin') {
      const unauthorized = leads.some(lead => 
        lead.assignedTo && lead.assignedTo._id.toString() !== req.user.id
      );
      
      if (unauthorized) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete some of these leads' });
      }
    }
    
    // Remove agent from B2C records BEFORE deleting CRM lead
    const b2cCleanupPromises = leads.map(lead => {
      // Removed detailed logging inside map
      if (lead.leadType === 'website' && lead.user && lead.assignedTo) {
        return removeAgentFromB2CRecords(lead.user.toString(), lead.assignedTo._id);
      } else {
        return Promise.resolve(); 
      }
    });

    await Promise.allSettled(b2cCleanupPromises);
    // Optional: Keep a summary log if desired
    // console.log('Finished attempting B2C agent removal for selected leads.');
    
    // Proceed with deleting CRM leads
    await Lead.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting multiple leads:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Upload leads from CSV
// @route   POST /api/crm/leads/upload
// @access  Private
exports.uploadLeads = async (req, res) => {
  try {
    const { Lead } = getModels();
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }
    
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Basic validation
        if (!data.firstName || !data.lastName || !data.email) {
          errors.push({ row: data, error: 'Missing required fields' });
          return;
        }
        
        // Transform CSV data to match Lead model
        const leadData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || '',
          status: data.status || 'new',
          source: data.source || 'website',
          notes: data.notes || '',
          itineraryPreferences: {
            destination: data.destination || '',
            budget: data.budget ? Number(data.budget) : undefined,
            numberOfTravelers: data.numberOfTravelers ? Number(data.numberOfTravelers) : undefined,
            accommodationPreference: data.accommodationPreference || ''
          },
          assignedTo: req.user.id
        };
        
        results.push(leadData);
      })
      .on('end', async () => {
        // Remove temp file
        fs.unlinkSync(req.file.path);
        
        if (results.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'No valid leads found in CSV',
            errors
          });
        }
        
        // Insert leads to database
        try {
          const insertedLeads = await Lead.insertMany(results);
          
          return res.status(201).json({
            success: true,
            count: insertedLeads.length,
            data: insertedLeads,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ success: false, message: 'Error inserting leads', error: err.message });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all website leads
// @route   GET /api/crm/leads/website
// @access  Private
exports.getWebsiteLeads = async (req, res) => {
  try {
    // Verify user authentication
    if (!req.user || !req.user.id || !req.user.role) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Connect to B2C database
    const connection = await getB2CDatabaseConnection();
    
    // Import B2C models
    const B2CUserSchema = require('../../b2c/models/User').schema;
    const B2CUserModel = connection.model('User', B2CUserSchema);
    const ItineraryInquirySchema = require('../../b2c/models/ItineraryInquiry').schema;
    const ItinerarySchema = require('../../b2c/models/Itinerary').schema;
    const ItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquirySchema);
    const ItineraryModel = connection.model('Itinerary', ItinerarySchema);
    
    // Import CRM Lead Model
    const { Lead } = getModels(); // Get CRM Lead model instance
    
    // *** NEW: Import B2C ItineraryBooking and Payment models ***
    const ItineraryBookingSchema = require('../../b2c/models/ItineraryBooking').schema;
    const PaymentSchema = require('../../b2c/models/Payment').schema;
    const ItineraryBookingModel = connection.model('ItineraryBooking', ItineraryBookingSchema);
    const PaymentModel = connection.model('Payment', PaymentSchema);

    // Find all B2C users 
    const b2cUsers = await B2CUserModel.find()
      .select('_id firstName lastName email phoneNumber countryCode country createdAt')
      .sort('-createdAt')
      .lean();
    
    const userIds = b2cUsers.map(user => user._id);

    // ** MODIFIED: Find corresponding CRM Leads, include status **
    const crmLeads = await Lead.find({
      leadType: 'website',
      user: { $in: userIds } 
    })
    // Select necessary fields including status
    .select('user assignedTo status') 
    .populate('assignedTo', 'name email employeeId') 
    .lean();

    // Create map of CRM leads keyed by B2C user ID (Keep existing)
    const crmLeadMap = {};
    crmLeads.forEach(lead => {
      if (lead.user) {
        crmLeadMap[lead.user.toString()] = lead;
      }
    });
    
    // Fetch inquiries and itineraries (Keep existing logic)
    // ... (inquiryMap, itineraryMap creation) ...
     const userIdsStrings = userIds.map(id => id.toString());
    // Build query for inquiries based on user role
    let inquiryQuery = { 'userInfo.userId': { $in: userIdsStrings } };
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        inquiryQuery = {
            ...inquiryQuery, 
            'agents.agentId': req.user.id
        };
    }
    const inquiries = await ItineraryInquiryModel.find(inquiryQuery)
      .select('itineraryInquiryToken userInfo agents createdAt selectedCities departureDates')
      .lean();
    
    // Build query for itineraries based on user role
    let itineraryQuery = { 'userInfo.userId': { $in: userIdsStrings } };
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        itineraryQuery = {
            ...itineraryQuery, 
            'agents.agentId': req.user.id
        };
    }
    const itineraries = await ItineraryModel.find(itineraryQuery)
      .select('itineraryToken inquiryToken userInfo agents createdAt paymentStatus')
      .lean();
    
    // Create inquiry map by userId
    const inquiryMap = {};
    inquiries.forEach(inquiry => {
      const userId = inquiry.userInfo?.userId;
      if (!userId) return;
      if (!inquiryMap[userId]) {
        inquiryMap[userId] = [];
      }
      inquiryMap[userId].push({
        inquiryToken: inquiry.itineraryInquiryToken,
        createdAt: inquiry.createdAt,
        agentId: inquiry.agents && inquiry.agents.length > 0 ? inquiry.agents[0].agentId : null,
        agentName: inquiry.agents && inquiry.agents.length > 0 ? inquiry.agents[0].agentName : null,
        destinations: inquiry.selectedCities ? inquiry.selectedCities.map(city => city.city).join(', ') : 'N/A',
        startDate: inquiry.departureDates?.startDate,
        endDate: inquiry.departureDates?.endDate
      });
    });
    
    // Create itinerary map by userId and collect itineraryTokens
    const itineraryMap = {};
    const allItineraryTokens = []; // Collect all tokens
    itineraries.forEach(itinerary => {
      const userId = itinerary.userInfo?.userId;
      if (!userId) return;
      if (!itineraryMap[userId]) {
        itineraryMap[userId] = [];
      }
      // Store basic itinerary info for now, enhance later
      itineraryMap[userId].push({
        itineraryToken: itinerary.itineraryToken,
        inquiryToken: itinerary.inquiryToken,
        createdAt: itinerary.createdAt,
        agentId: itinerary.agents && itinerary.agents.length > 0 ? itinerary.agents[0].agentId : null,
        agentName: itinerary.agents && itinerary.agents.length > 0 ? itinerary.agents[0].agentName : null,
        // Initial status from Itinerary model (might be overridden)
        status: itinerary.paymentStatus || itinerary.status || 'pending' 
      });
      // Collect token for fetching booking/payment details
      if (itinerary.itineraryToken) {
        allItineraryTokens.push(itinerary.itineraryToken);
      }
    });

    // *** NEW: Fetch ItineraryBookings and Payments based on itineraryTokens ***
    let itineraryBookingMap = {};
    let paymentMap = {};

    if (allItineraryTokens.length > 0) {
      const itineraryBookings = await ItineraryBookingModel.find({ 
        itineraryToken: { $in: allItineraryTokens } 
      })
      .select('itineraryToken bookingId status paymentStatus razorpay.orderId') // Select needed fields
      .lean();
    
      const bookingIds = itineraryBookings.map(ib => ib.bookingId).filter(Boolean);
      
      // Create booking map keyed by itineraryToken
      itineraryBookings.forEach(ib => {
         itineraryBookingMap[ib.itineraryToken] = ib;
      });
      
      // Fetch related payments if bookingIds exist
      if (bookingIds.length > 0) {
          const payments = await PaymentModel.find({ 
              bookingId: { $in: bookingIds } 
          })
          .select('bookingId razorpay.paymentId') // Select needed fields
        .lean();
      
          // Create payment map keyed by bookingId
          payments.forEach(p => {
              paymentMap[p.bookingId] = p; 
          });
      }
    }
    // *** END NEW FETCHING ***

    // Filter B2C users (Keep existing visibility logic)
     let relevantUsers = b2cUsers;
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        relevantUsers = b2cUsers.filter(u => {
            const userIdStr = u._id.toString();
            const hasMatchingActivity = inquiryMap[userIdStr]?.length > 0 || itineraryMap[userIdStr]?.length > 0;
            const isAssignedInCrm = crmLeadMap[userIdStr]?.assignedTo?._id.toString() === req.user.id;
            return hasMatchingActivity || isAssignedInCrm;
        });
    }

    // ** MODIFIED: Enhance B2C user data with CRM Lead status & detailed itinerary info **
    const enhancedUsers = relevantUsers.map(b2cUser => {
      const userIdStr = b2cUser._id.toString();
      const crmLead = crmLeadMap[userIdStr]; // Get corresponding CRM Lead
      
      // Enhance itineraries with booking/payment details
      const enhancedItineraries = (itineraryMap[userIdStr] || []).map(itin => {
          const bookingInfo = itineraryBookingMap[itin.itineraryToken];
          let paymentInfo = null;
          if (bookingInfo && bookingInfo.bookingId) {
             paymentInfo = paymentMap[bookingInfo.bookingId];
          }
          
          return {
              ...itin,
              bookingStatus: bookingInfo?.status || null,
              bookingId: bookingInfo?.bookingId || null,
              paymentStatus: bookingInfo?.paymentStatus || null, // Use status from ItineraryBooking
              // Use razorpay.paymentId if available from Payment collection
              paymentId: paymentInfo?.razorpay?.paymentId || bookingInfo?.razorpay?.orderId || null 
          };
      });
        
        return {
        _id: userIdStr, 
        crmLeadId: crmLead?._id, 
        firstName: b2cUser.firstName,
        lastName: b2cUser.lastName,
        fullName: `${b2cUser.firstName} ${b2cUser.lastName}`,
        email: b2cUser.email,
        phone: b2cUser.phoneNumber,
        countryCode: b2cUser.countryCode,
        country: b2cUser.country,
        createdAt: b2cUser.createdAt, 
        inquiries: inquiryMap[userIdStr] || [],
        // Use the enhanced itineraries
        itineraries: enhancedItineraries, 
        leadType: 'website',
        assignedTo: crmLead?.assignedTo || null, 
        status: crmLead?.status || 'N/A' // Add status from CRM lead, default to N/A
        };
      });
    
    res.status(200).json({
      success: true,
      count: enhancedUsers.length,
      data: enhancedUsers
    });
  } catch (error) {
    console.error('Error fetching website leads:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Assign a lead to an agent
// @route   POST /api/crm/leads/assign/:leadId
// @access  Private
exports.assignLeadToAgent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const { Lead, User } = getModels();
    
    // Check if agent exists
    const agent = await User.findById(req.body.agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Check if this is a website lead from B2C user
    let lead;
    let isWebsiteLead = false;
    
    // If leadId is a MongoDB ObjectId, try to find existing lead
    if (mongoose.Types.ObjectId.isValid(req.params.leadId)) {
      lead = await Lead.findById(req.params.leadId);
    }
    
    // If no lead found, check if leadId is a B2C user ID
    if (!lead) {
      // Connect to B2C database
      const connection = await getB2CDatabaseConnection();
      const B2CUserSchema = require('../../b2c/models/User').schema;
      const B2CUserModel = connection.model('User', B2CUserSchema);
      
      // Find the B2C user
      const b2cUser = await B2CUserModel.findById(req.params.leadId);
      
      if (!b2cUser) {
        return res.status(404).json({ success: false, message: 'Lead or B2C user not found' });
      }
      
      // Create a new lead for this B2C user
      isWebsiteLead = true;
      
      // Check if a lead already exists for this user
      const existingLead = await Lead.findOne({ 
        user: b2cUser._id,
        leadType: 'website'
      });
      
      if (existingLead) {
        lead = existingLead;
      } else {
        // Create new lead
        lead = await Lead.create({
          user: b2cUser._id,
          firstName: b2cUser.firstName,
          lastName: b2cUser.lastName,
          email: b2cUser.email,
          phone: b2cUser.phoneNumber || '',
          status: 'new',
          leadType: 'website',
          source: 'website',
          assignedTo: req.body.agentId,
          assignedAt: Date.now()
        });
      }
    }
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Update lead with new agent
    lead.assignedTo = req.body.agentId;
    lead.assignedAt = Date.now();
    lead.status = 'assigned'; // Set status to assigned upon assignment
    
    await lead.save();
    
    // If this is a website lead, also update the associated inquiries and itineraries
    if (isWebsiteLead && lead.user) {
      await updateUserInquiriesAndItinerariesWithAgent(
        lead.user.toString(),
        req.body.agentId,
        agent.name,
        agent.email,
        agent.employeeId // Pass agent's employeeId here
      );
    }
    
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error assigning lead to agent:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Helper function to update inquiries and itineraries with agent info
async function updateUserInquiriesAndItinerariesWithAgent(userId, agentId, agentName, agentEmail, employeeId) {
  try {
    // Connect to B2C database
    const connection = await getB2CDatabaseConnection();
    
    // Get models
    const ItineraryInquirySchema = require('../../b2c/models/ItineraryInquiry').schema;
    const ItinerarySchema = require('../../b2c/models/Itinerary').schema;
    const ItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquirySchema);
    const ItineraryModel = connection.model('Itinerary', ItinerarySchema);
    
    // Create agent info object
    const agentInfo = {
      agentId: agentId,
      agentName: agentName,
      agentEmail: agentEmail,
      employeeId: employeeId
    };
    
    // Update inquiries
    const inquiryUpdateResult = await ItineraryInquiryModel.updateMany(
      { 'userInfo.userId': userId },
      { $addToSet: { agents: agentInfo } }
    );
    console.log(`Inquiry update for user ${userId}: Matched ${inquiryUpdateResult.matchedCount}, Modified ${inquiryUpdateResult.modifiedCount}`);
    
    // Update itineraries
    const itineraryUpdateResult = await ItineraryModel.updateMany(
      { 'userInfo.userId': userId },
      { $addToSet: { agents: agentInfo } }
    );
    console.log(`Itinerary update for user ${userId} with agent ${agentId}: Matched ${itineraryUpdateResult.matchedCount}, Modified ${itineraryUpdateResult.modifiedCount}`);
    if (itineraryUpdateResult.matchedCount === 0) {
      console.warn(`WARN: No itinerary documents found for user ${userId} during agent assignment.`);
    } else if (itineraryUpdateResult.modifiedCount === 0 && itineraryUpdateResult.matchedCount > 0) {
      console.warn(`WARN: Itinerary documents found for user ${userId}, but none modified. Agent ${agentId} might already exist.`);
    } else {
      console.log(`Successfully updated inquiries and itineraries for user ${userId} with agent ${agentId}`);
    }
    
    console.log(`Finished updating inquiries and itineraries for user ${userId} with agent ${agentId}`);
  } catch (error) {
    console.error('Error updating inquiries and itineraries with agent:', error);
    throw error;
  }
}

// Helper function to remove a specific agent from a B2C user's inquiries and itineraries
async function removeAgentFromB2CRecords(userId, agentId) {
  try {
    const connection = await getB2CDatabaseConnection();
    if (!connection) {
        throw new Error("Failed to establish B2C DB connection for agent removal.");
    }
    
    const ItineraryInquirySchema = require('../../b2c/models/ItineraryInquiry').schema;
    const ItinerarySchema = require('../../b2c/models/Itinerary').schema;
    const ItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquirySchema);
    const ItineraryModel = connection.model('Itinerary', ItinerarySchema);
    
    let agentPullCondition;
    try {
      agentPullCondition = { agentId: new mongoose.Types.ObjectId(agentId) }; 
    } catch (objectIdError) {
      throw new Error(`Invalid agentId format: ${agentId}`);
    }
    
    // Update inquiries: Remove agent from agents array
    const inquiryUpdateResult = await ItineraryInquiryModel.updateMany(
      { 'userInfo.userId': userId },
      { $pull: { agents: agentPullCondition } }
    );
    // Keep summary log
    console.log(`B2C Inquiry agent removal for user ${userId}, agent ${agentId}: Matched ${inquiryUpdateResult.matchedCount}, Modified ${inquiryUpdateResult.modifiedCount}`);

    // Update itineraries: Remove agent from agents array
    const itineraryUpdateResult = await ItineraryModel.updateMany(
      { 'userInfo.userId': userId },
      { $pull: { agents: agentPullCondition } }
    );
    // Keep summary log
    console.log(`B2C Itinerary agent removal for user ${userId}, agent ${agentId}: Matched ${itineraryUpdateResult.matchedCount}, Modified ${itineraryUpdateResult.modifiedCount}`);
    
  } catch (error) {
    // Keep error log, but make it clear it's from the helper
    console.error(`Error in removeAgentFromB2CRecords (user: ${userId}, agent: ${agentId}):`, error);
    // Re-throwing allows the Promise.allSettled to report failure, but deletion still proceeds
    throw error; 
  }
}

// *** NEW: Update Lead Status and Add Note ***
// @desc    Update lead status and add note
// @route   PUT /api/crm/leads/:id/status
// @access  Private
exports.updateLeadStatus = async (req, res) => {
  try {
    const { Lead } = getModels();
    const { status, note } = req.body;
    const leadId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!status || !note) {
      return res.status(400).json({ success: false, message: 'New status and note are required' });
    }

    const lead = await Lead.findById(leadId).populate('assignedTo', '_id'); // Populate to check ownership

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Authorization: Admin or the assigned agent can update status
    if (userRole !== 'admin' && (!lead.assignedTo || lead.assignedTo._id.toString() !== userId)) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this lead status' });
    }

    // Validate Status against Schema Enum
    if (!Lead.schema.path('status').enumValues.includes(status)) {
       return res.status(400).json({ success: false, message: `Invalid status value: ${status}` });
    }

    // Prepend note
    const timestamp = new Date().toISOString();
    const formattedNote = `[${timestamp}] Status changed to ${status}. Note: ${note}\n--------------------\n${lead.notes || ''}`;

    // Update lead
    lead.status = status;
    lead.notes = formattedNote;
    lead.updatedAt = Date.now();

    const updatedLead = await lead.save();

    // Repopulate assignedTo for the response if needed (or select fields)
    await updatedLead.populate({ path: 'assignedTo', select: 'name email employeeId' });

    res.status(200).json({ success: true, data: updatedLead });

  } catch (error) {
    console.error(`Error updating lead status for ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server Error updating status' });
  }
};
// *** END NEW FUNCTION ***