// crm/config/db.js
const mongoose = require('mongoose');

// Create a separate connection for CRM database
const connectCRMDB = async () => {
  try {
    const crmConnection = await mongoose.createConnection(process.env.MONGO_URI, {
      dbName: 'syt_crm'
    });
    
    console.log(`CRM MongoDB connected to database: syt_crm`);
    
    // Return the connection for model creation
    return crmConnection;
  } catch (error) {
    console.error(`CRM MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectCRMDB;