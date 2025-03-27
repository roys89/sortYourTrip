// crm/controllers/leadController.js
const { getModels } = require('../models/Index'); // Import getModels instead of Lead directly
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const fs = require('fs');

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