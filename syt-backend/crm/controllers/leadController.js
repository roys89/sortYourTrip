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
    
    // Build query object initially from request query parameters
    let queryFilter = {};
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    queryFilter = JSON.parse(queryStr);

    // *** Add Role-Based Filtering ***
    // If the user is not admin or manager, filter by assignedTo
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      queryFilter.assignedTo = user.id; // Add filter for leads assigned to the current user
    }
    // *** End Role-Based Filtering ***
    
    // Finding resource using the combined filter
    let query = Lead.find(queryFilter);
    
    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    // Use the final queryFilter for counting documents
    const total = await Lead.countDocuments(queryFilter);
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query - ensure assignedTo is populated
    const leads = await query.populate({
      path: 'assignedTo',
      select: 'name email'
    });
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: leads.length,
      pagination,
      data: leads
    });
  } catch (error) {
    console.error(error);
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
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Make sure user is lead owner or admin
    if (lead.assignedTo && lead.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: `Not authorized to delete this lead` });
    }
    
    await lead.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
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
    
    // Find all leads
    const leads = await Lead.find({ _id: { $in: ids } });
    
    // Check authorization
    if (req.user.role !== 'admin') {
      const unauthorized = leads.some(lead => 
        lead.assignedTo && lead.assignedTo.toString() !== req.user.id
      );
      
      if (unauthorized) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete some of these leads' });
      }
    }
    
    await Lead.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
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
    const user = req.user;
    if (!user || !user.id || !user.role) {
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
    
    // Find all B2C users 
    const users = await B2CUserModel.find()
      .select('_id firstName lastName email phoneNumber countryCode country createdAt')
      .sort('-createdAt')
      .lean();
    
    const userIds = users.map(user => user._id);
    const userIdsStrings = userIds.map(id => id.toString());

    // Find corresponding CRM Lead records for these B2C users
    const crmLeads = await Lead.find({
      leadType: 'website',
      user: { $in: userIds } // Match B2C user ID
    })
    .populate('assignedTo', 'name email') // Populate the assigned agent
    .lean();

    // Create a map of CRM leads keyed by B2C user ID
    const crmLeadMap = {};
    crmLeads.forEach(lead => {
      if (lead.user) {
        crmLeadMap[lead.user.toString()] = lead;
      }
    });
    
    // Build query for inquiries based on user role
    let inquiryQuery = { 'userInfo.userId': { $in: userIdsStrings } };
    if (user.role !== 'admin' && user.role !== 'manager') {
        inquiryQuery = {
            ...inquiryQuery, 
            'agents.agentId': user.id
        };
    }
    const inquiries = await ItineraryInquiryModel.find(inquiryQuery)
      .select('itineraryInquiryToken userInfo agents createdAt selectedCities departureDates')
      .lean();
    
    // Build query for itineraries based on user role
    let itineraryQuery = { 'userInfo.userId': { $in: userIdsStrings } };
    if (user.role !== 'admin' && user.role !== 'manager') {
        itineraryQuery = {
            ...itineraryQuery, 
            'agents.agentId': user.id
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
    
    // Create itinerary map by userId
    const itineraryMap = {};
    itineraries.forEach(itinerary => {
      const userId = itinerary.userInfo?.userId;
      if (!userId) return;
      if (!itineraryMap[userId]) {
        itineraryMap[userId] = [];
      }
      itineraryMap[userId].push({
        itineraryToken: itinerary.itineraryToken,
        inquiryToken: itinerary.inquiryToken,
        createdAt: itinerary.createdAt,
        agentId: itinerary.agents && itinerary.agents.length > 0 ? itinerary.agents[0].agentId : null,
        agentName: itinerary.agents && itinerary.agents.length > 0 ? itinerary.agents[0].agentName : null,
        status: itinerary.paymentStatus || 'pending'
      });
    });
    
    // Filter B2C users based on agent visibility rules (if applicable)
    // Admins/Managers see all. Agents see users IF they have matching inquiries/itineraries OR if the CRM lead is assigned to them.
    let relevantUsers = users;
    if (user.role !== 'admin' && user.role !== 'manager') {
        relevantUsers = users.filter(u => {
            const userIdStr = u._id.toString();
            const hasMatchingActivity = inquiryMap[userIdStr]?.length > 0 || itineraryMap[userIdStr]?.length > 0;
            const isAssignedInCrm = crmLeadMap[userIdStr]?.assignedTo?._id.toString() === user.id;
            return hasMatchingActivity || isAssignedInCrm;
        });
    }

    // Enhance the filtered user data with CRM Lead info, inquiries, and itineraries
    const enhancedUsers = relevantUsers.map(user => {
      const userIdStr = user._id.toString();
      const crmLead = crmLeadMap[userIdStr]; // Get corresponding CRM Lead

      return {
        _id: userIdStr, // Use B2C user ID as the primary ID for the row
        crmLeadId: crmLead?._id, // Optionally include CRM Lead ID if needed elsewhere
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber,
        countryCode: user.countryCode,
        country: user.country,
        createdAt: user.createdAt, // B2C User creation date
        inquiries: inquiryMap[userIdStr] || [],
        itineraries: itineraryMap[userIdStr] || [],
        leadType: 'website',
        assignedTo: crmLead?.assignedTo || null // Use the populated assignedTo from CRM Lead
        // assignedAt: crmLead?.assignedAt // Can include if needed
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
    
    await lead.save();
    
    // If this is a website lead, also update the associated inquiries and itineraries
    if (isWebsiteLead && lead.user) {
      await updateUserInquiriesAndItinerariesWithAgent(
        lead.user.toString(),
        req.body.agentId,
        agent.name,
        agent.email
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
async function updateUserInquiriesAndItinerariesWithAgent(userId, agentId, agentName, agentEmail) {
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
      agentEmail: agentEmail
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
      console.log(`Successfully updated itineraries for user ${userId} with agent ${agentId}`);
    }
    
    console.log(`Finished updating inquiries and itineraries for user ${userId} with agent ${agentId}`);
  } catch (error) {
    console.error('Error updating inquiries and itineraries with agent:', error);
    throw error;
  }
}