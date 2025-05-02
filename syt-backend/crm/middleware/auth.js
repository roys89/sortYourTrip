// crm/middleware/auth.js
const jwt = require('jsonwebtoken');
const { getModels } = require('../models/Index');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get User model from models
    const { User } = getModels();
    
    // Find user by ID
    req.user = await User.findById(decoded.id).select('-password');
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// Check specific permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    // Add debug logs
    console.log('==== PERMISSION DEBUG ====');
    console.log('Permission requested:', permission);
    console.log('User role:', req.user.role);
    console.log('User permissions (JSON):', req.user.permissions ? JSON.stringify(req.user.permissions, null, 2) : 'UNDEFINED');
    
    // Inspect the permissions object structure
    console.log('Object.keys(permissions):', Object.keys(req.user.permissions || {}));
    console.log('Object.getOwnPropertyNames(permissions):', Object.getOwnPropertyNames(req.user.permissions || {}));
    
    // Admin check
    if (req.user.role === 'admin') {
      console.log('ADMIN ACCESS GRANTED');
      return next(); // Admins have all permissions
    }
    
    // Special case for 'bookings' permission
    if (permission === 'bookings') {
      // Use bracket notation instead of dot notation
      const canBookFlights = req.user.permissions['canBookFlights'];
      const canBookHotels = req.user.permissions['canBookHotels'];
      const canBookActivities = req.user.permissions['canBookActivities'];
      const canBookTransfers = req.user.permissions['canBookTransfers'];
      const canBookItineraries = req.user.permissions['canBookItineraries'];
      const bookings = req.user.permissions['bookings'];
      
      console.log('Permissions accessed via bracket notation:');
      console.log('- canBookFlights:', canBookFlights);
      console.log('- canBookHotels:', canBookHotels);
      console.log('- canBookActivities:', canBookActivities);
      console.log('- canBookTransfers:', canBookTransfers);
      console.log('- canBookItineraries:', canBookItineraries);
      console.log('- bookings:', bookings);
      
      // EMERGENCY SOLUTION: Access permissions directly from JSON keys
      // This should work even if the object structure is unusual
      const permissionsJson = JSON.parse(JSON.stringify(req.user.permissions));
      console.log('Permissions after JSON roundtrip:', permissionsJson);
      
      if (permissionsJson.canBookFlights === true || 
          permissionsJson.canBookHotels === true ||
          permissionsJson.canBookActivities === true ||
          permissionsJson.canBookTransfers === true ||
          permissionsJson.canBookItineraries === true ||
          permissionsJson.bookings === true) {
        console.log('Access granted: Permission found via JSON roundtrip');
        return next();
      }
      
      // If we got here, try one last approach - check each key in the object
      const permissionKeys = Object.keys(req.user.permissions || {});
      console.log('Checking all permission keys:', permissionKeys);
      
      // Look for any booking-related permissions that are true
      for (const key of permissionKeys) {
        if (key.includes('Book') && req.user.permissions[key] === true) {
          console.log(`Access granted: Found true value for permission key: ${key}`);
          return next();
        }
      }
    }
    // For other specific permissions
    else if (req.user.permissions && req.user.permissions[permission]) {
      console.log(`Access granted: specific permission ${permission} is true`);
      return next();
    }
    
    // No permission found
    console.log('PERMISSION DENIED: No matching permissions found');
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  };
};