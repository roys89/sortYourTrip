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
    const { Lead } = getModels(); // Get Lead model instance
    
    // Build query
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    query = Lead.find(JSON.parse(queryStr));
    
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
    const total = await Lead.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
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
    
    const lead = await Lead.findById(req.params.id).populate({
      path: 'assignedTo',
      select: 'name email'
    });
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error(error);
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
    // Connect to B2C database to get users
    const connection = await getB2CDatabaseConnection();
    
    // Import B2C models
    const B2CUserSchema = require('../../b2c/models/User').schema;
    const B2CUserModel = connection.model('User', B2CUserSchema);
    
    // Import inquiry and itinerary schemas
    const ItineraryInquirySchema = require('../../b2c/models/ItineraryInquiry').schema;
    const ItinerarySchema = require('../../b2c/models/Itinerary').schema;
    const ItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquirySchema);
    const ItineraryModel = connection.model('Itinerary', ItinerarySchema);
    
    // Find all B2C users
    const users = await B2CUserModel.find()
      .select('_id firstName lastName email phoneNumber countryCode country createdAt')
      .sort('-createdAt')
      .lean();
    
    // Get all user IDs
    const userIds = users.map(user => user._id);
    
    // Get inquiries for these users
    const inquiries = await ItineraryInquiryModel.find({'userInfo.userId': {$in: userIds.map(id => id.toString())}})
      .select('itineraryInquiryToken userInfo agents createdAt selectedCities departureDates')
      .lean();
    
    // Get itineraries for these users
    const itineraries = await ItineraryModel.find({'userInfo.userId': {$in: userIds.map(id => id.toString())}})
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
      
      // Add simplified inquiry data
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
      
      // Add simplified itinerary data
      itineraryMap[userId].push({
        itineraryToken: itinerary.itineraryToken,
        inquiryToken: itinerary.inquiryToken,
        createdAt: itinerary.createdAt,
        agentId: itinerary.agents && itinerary.agents.length > 0 ? itinerary.agents[0].agentId : null,
        agentName: itinerary.agents && itinerary.agents.length > 0 ? itinerary.agents[0].agentName : null,
        status: itinerary.paymentStatus || 'pending'
      });
    });
    
    // Enhance user data with inquiries and itineraries
    const enhancedUsers = users.map(user => {
      const userId = user._id.toString();
      
      return {
        _id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber,
        countryCode: user.countryCode,
        country: user.country,
        createdAt: user.createdAt,
        inquiries: inquiryMap[userId] || [],
        itineraries: itineraryMap[userId] || [],
        leadType: 'website',
        // If user is already assigned to an agent (check both inquiries and itineraries)
        assignedTo: getUserAssignedAgent(userId, inquiryMap, itineraryMap)
      };
    });
    
    // Get the CRM Lead model to find existing lead assignments
    const { Lead } = getModels();
    const existingLeads = await Lead.find({
      leadType: 'website',
      source: 'website'
    }).select('user assignedTo').lean();
    
    // Create map of existing leads by user ID
    const leadMap = {};
    existingLeads.forEach(lead => {
      if (lead.user) {
        leadMap[lead.user.toString()] = lead.assignedTo;
      }
    });
    
    // Update user assigned info from leads table
    const finalUsers = enhancedUsers.map(user => {
      if (leadMap[user._id]) {
        user.leadAssigned = true;
        user.assignedToId = leadMap[user._id];
      } else {
        user.leadAssigned = false;
      }
      return user;
    });
    
    res.status(200).json({
      success: true,
      count: finalUsers.length,
      data: finalUsers
    });
  } catch (error) {
    console.error('Error fetching website leads:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Helper function to determine if a user is assigned to an agent
function getUserAssignedAgent(userId, inquiryMap, itineraryMap) {
  // Check itineraries first as they're more significant
  if (itineraryMap[userId] && itineraryMap[userId].length > 0) {
    for (const itinerary of itineraryMap[userId]) {
      if (itinerary.agentId) {
        return {
          agentId: itinerary.agentId,
          agentName: itinerary.agentName
        };
      }
    }
  }
  
  // Then check inquiries
  if (inquiryMap[userId] && inquiryMap[userId].length > 0) {
    for (const inquiry of inquiryMap[userId]) {
      if (inquiry.agentId) {
        return {
          agentId: inquiry.agentId,
          agentName: inquiry.agentName
        };
      }
    }
  }
  
  return null;
}

// @desc    Get all leads assigned to the current agent
// @route   GET /api/crm/leads/agent-leads
// @access  Private
exports.getAgentLeads = async (req, res) => {
  try {
    const { Lead } = getModels();
    
    // Get regular leads assigned to this agent
    const leads = await Lead.find({ assignedTo: req.user.id })
      .sort('-createdAt')
      .lean();
    
    // Get B2C website leads
    const websiteLeads = leads.filter(lead => lead.leadType === 'website' && lead.user);
    const regularLeads = leads.filter(lead => lead.leadType !== 'website' || !lead.user);
    
    // If we have website leads, get their details
    let enhancedWebsiteLeads = [];
    
    if (websiteLeads.length > 0) {
      // Connect to B2C database
      const connection = await getB2CDatabaseConnection();
      
      // Import B2C models
      const ItineraryInquirySchema = require('../../b2c/models/ItineraryInquiry').schema;
      const ItinerarySchema = require('../../b2c/models/Itinerary').schema;
      const B2CUserSchema = require('../../b2c/models/User').schema;
      
      const ItineraryInquiryModel = connection.model('ItineraryInquiry', ItineraryInquirySchema);
      const ItineraryModel = connection.model('Itinerary', ItinerarySchema);
      const B2CUserModel = connection.model('User', B2CUserSchema);
      
      // Get all B2C user IDs from website leads
      const userIds = websiteLeads.map(lead => lead.user);
      
      // Get B2C user details
      const users = await B2CUserModel.find({ _id: { $in: userIds } })
        .select('_id firstName lastName email phoneNumber countryCode country createdAt')
        .lean();
      
      // Create user map for quick lookup
      const userMap = {};
      users.forEach(user => {
        userMap[user._id.toString()] = user;
      });
      
      // Get inquiries where this agent is assigned
      const inquiries = await ItineraryInquiryModel.find({
        'agents.agentId': req.user.id
      })
        .select('itineraryInquiryToken userInfo agents createdAt selectedCities departureDates')
        .lean();
      
      // Get itineraries where this agent is assigned
      const itineraries = await ItineraryModel.find({
        'agents.agentId': req.user.id
      })
        .select('itineraryToken inquiryToken userInfo agents createdAt paymentStatus')
        .lean();
      
      // Create maps for inquiries and itineraries
      const inquiryMap = {};
      const itineraryMap = {};
      
      // Group inquiries by user ID
      inquiries.forEach(inquiry => {
        const userId = inquiry.userInfo?.userId;
        if (!userId) return;
        
        if (!inquiryMap[userId]) {
          inquiryMap[userId] = [];
        }
        
        inquiryMap[userId].push({
          inquiryToken: inquiry.itineraryInquiryToken,
          createdAt: inquiry.createdAt,
          destinations: inquiry.selectedCities ? inquiry.selectedCities.map(city => city.city).join(', ') : 'N/A',
          startDate: inquiry.departureDates?.startDate,
          endDate: inquiry.departureDates?.endDate
        });
      });
      
      // Group itineraries by user ID
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
          status: itinerary.paymentStatus || 'pending'
        });
      });
      
      // Enhance website leads with user details, inquiries, and itineraries
      enhancedWebsiteLeads = websiteLeads.map(lead => {
        const userId = lead.user.toString();
        const user = userMap[userId] || {};
        
        return {
          ...lead,
          fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (lead.firstName + ' ' + lead.lastName),
          email: user.email || lead.email,
          phone: user.phoneNumber || lead.phone,
          countryCode: user.countryCode,
          country: user.country,
          inquiries: inquiryMap[userId] || [],
          itineraries: itineraryMap[userId] || []
        };
      });
    }
    
    // Combine regular leads and enhanced website leads
    const combinedLeads = [...regularLeads, ...enhancedWebsiteLeads];
    
    res.status(200).json({
      success: true,
      count: combinedLeads.length,
      data: combinedLeads
    });
  } catch (error) {
    console.error('Error fetching agent leads:', error);
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
    await ItineraryInquiryModel.updateMany(
      { 'userInfo.userId': userId },
      { $addToSet: { agents: agentInfo } }
    );
    
    // Update itineraries
    await ItineraryModel.updateMany(
      { 'userInfo.userId': userId },
      { $addToSet: { agents: agentInfo } }
    );
    
    console.log(`Updated inquiries and itineraries for user ${userId} with agent ${agentId}`);
  } catch (error) {
    console.error('Error updating inquiries and itineraries with agent:', error);
    throw error;
  }
}