// crm/index.js
const bcrypt = require('bcryptjs');
const { initModels, getModels } = require('./models/Index');

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

module.exports = initCRM;

