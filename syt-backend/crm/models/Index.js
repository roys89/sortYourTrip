// crm/models/index.js
const connectCRMDB = require('../config/db');
const UserModel = require('./User');
const LeadModel = require('./Lead');

// Models object to hold all CRM models
const models = {};

// Initialize models function
const initModels = async () => {
  try {
    // Get the CRM database connection
    const crmConnection = await connectCRMDB();
    
    // Initialize models with the connection
    models.User = UserModel(crmConnection);
    models.Lead = LeadModel(crmConnection);
    
    console.log('CRM models initialized successfully');
    
    return models;
  } catch (error) {
    console.error('Error initializing CRM models:', error);
    throw error;
  }
};

module.exports = {
  initModels,
  getModels: () => models
};