// crm/index.js
const bcrypt = require('bcryptjs');
const { initModels, getModels } = require('./models/Index');
// Remove express and router imports if no longer needed here
// const express = require('express'); 
// const cors = require('cors');
// const json = require('express').json;
// const leadRoutes = require('./routes/leadRoutes');
// const userRoutes = require('./routes/userRoutes');
// const authRoutes = require('./routes/authRoutes');
// const bookingRoutes = require('./routes/bookingRoutes');
// const crmItineraryRoutes = require('./routes/itineraryRoutes');

// Initialize CRM
const initCRM = async () => {
  try {
    // Initialize the models
    await initModels();
    
    // Create default admin user
    await createDefaultAdmin();
    
    console.log('CRM system initialized successfully');
  } catch (error) {
    console.error('Error initializing CRM system:', error);
  }
};

// Create default admin user function
const createDefaultAdmin = async () => {
  try {
    const { User } = getModels();
    
    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        permissions: {
          canAddLead: true,
          canRemoveLead: true,
          canViewLeads: true,
          canAddUser: true,
          canRemoveUser: true
        }
      });
      console.log('CRM Admin user created');
    }
  } catch (error) {
    console.error('Error creating CRM admin user:', error);
  }
};

// Remove app instance and route mounting from here
/*
const app = express();

// Middleware
app.use(cors());
app.use(json());

// Mount Routes
app.use('/api/crm/auth', authRoutes);
app.use('/api/crm/leads', leadRoutes);
app.use('/api/crm/users', userRoutes);
app.use('/api/crm/bookings', bookingRoutes);
app.use('/api/crm/itineraries', crmItineraryRoutes);

// ... errorHandler

// ... server start logic
*/

module.exports = initCRM;

