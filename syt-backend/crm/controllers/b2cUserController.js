const mongoose = require('mongoose');
const crypto = require('crypto'); // Import crypto for token generation
const B2CUserSchema = require('../../b2c/models/User').schema; // Import B2C User schema
const { sendPasswordSetupEmail } = require('../utils/emailUtils'); // Import the email utility

// --- B2C Database Connection Management ---
// NOTE: Ideally, this connection should be established once in your main
// server file (e.g., server.js) and passed down or made globally accessible.
// This implementation establishes it on demand, which might not be optimal.
let b2cDbConnection = null;

const getB2CDatabaseConnection = async () => {
  if (b2cDbConnection && b2cDbConnection.readyState === 1) { // Check if connection exists and is open
    return b2cDbConnection;
  }
  try {
    console.log('Attempting to connect CRM backend to B2C database...');
    // Ensure using the correct URI for B2C DB
    b2cDbConnection = await mongoose.createConnection(process.env.MONGO_URI_B2C || process.env.MONGO_URI, { 
      dbName: 'syt_b2c', 
      useNewUrlParser: true, // Add these if not default
      useUnifiedTopology: true
    });
    console.log(`CRM backend successfully connected to B2C database: syt_b2c`);
    b2cDbConnection.on('error', (err) => {
      console.error('B2C DB Connection Error (from CRM backend): ', err);
      b2cDbConnection = null; 
    });
    b2cDbConnection.on('disconnected', () => {
      console.log('B2C DB Disconnected (from CRM backend)');
      b2cDbConnection = null; 
    });
    return b2cDbConnection;
  } catch (error) {
    console.error('FATAL: CRM backend failed to connect to B2C DB:', error);
    b2cDbConnection = null; 
    // Use standard Error instead of ErrorResponse
    const err = new Error('Could not establish connection to B2C database.');
    err.statusCode = 503; // Set a status code for error handling middleware if used
    throw err; 
  }
};
// ---------------------------------------------

// @desc    Search B2C users
// @route   GET /api/crm/users/search-b2c
// @access  Private (Agent)
exports.searchB2CUsers = async (req, res, next) => { // Added next for error handling
  const { query } = req.query;

  if (!query || query.trim().length < 3) {
    const err = new Error("Search query must be at least 3 characters long.");
    err.statusCode = 400;
    return next(err);
  }

  let connection;
  try {
    connection = await getB2CDatabaseConnection();
    // Removed redundant !connection check as getB2CDatabaseConnection throws

    const B2CUserModel = connection.model('User', B2CUserSchema);
    const searchRegex = new RegExp(query.trim(), 'i');

    const users = await B2CUserModel.find({
      $or: [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phoneNumber: searchRegex }
      ]
    })
    .select('_id firstName lastName email phoneNumber country countryCode dob accountStatus') // Added countryCode
    .limit(10)
    .lean(); 

    res.status(200).json({ users });

  } catch (error) {
    console.error("Error searching B2C users from CRM:", error);
    // Ensure statusCode is set if it's a connection error we threw
    if (!error.statusCode) error.statusCode = 500;
    return next(error); 
  }
};

// @desc    Register a B2C Customer via CRM Agent
// @route   POST /api/crm/users/register-customer
// @access  Private (Agent)
exports.registerB2CCustomer = async (req, res, next) => {
    const { 
        firstName, 
        lastName, 
        email, 
        phoneNumber, // Assuming frontend sends NATIONAL number now
        countryCode, // ADDED: Expect prefix like +91
        dob, 
        country,     // Full country name
        referralCode 
    } = req.body;

    try {
        // Use standard Error for validation
        // Added check for countryCode as it's now expected
        if (!firstName || !lastName || !email || !phoneNumber || !countryCode || !country || !dob) {
            const err = new Error('Please provide firstName, lastName, email, phoneNumber, countryCode, country, and dob');
            err.statusCode = 400;
            return next(err);
        }

        // 1. Connect to B2C Database (reuse existing function)
        const b2cConn = await getB2CDatabaseConnection();
        const B2CUserModel = b2cConn.model('User', B2CUserSchema); 

        // 2. Check if B2C user already exists
        const existingB2CUser = await B2CUserModel.findOne({ email: email.toLowerCase() });
        if (existingB2CUser) {
            const err = new Error(`A customer account already exists with the email ${email}`);
            err.statusCode = 400;
            return next(err);
        }

        // 3. Create new B2C user object (NO PASSWORD)
        const newB2CUserData = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber, // Save national number
            countryCode: countryCode || undefined, // ADDED
            dob,
            country: country || undefined, 
            referralCode: referralCode || undefined, 
            // accountStatus defaults to 'needs_password_setup' via schema
        };

        // --- Generate Password Setup Token --- 
        const setupToken = crypto.randomBytes(32).toString('hex'); // Generate random token
        const hashedToken = crypto // Hash the token before saving
            .createHash('sha256')
            .update(setupToken)
            .digest('hex');
        const tokenExpiry = Date.now() + 3600000; // Token expires in 1 hour

        // Add token details to user data before creating
        newB2CUserData.passwordResetToken = hashedToken;
        newB2CUserData.passwordResetExpires = tokenExpiry;
        // -----------------------------------
        
        // 4. Save the new B2C user
        const newB2CUser = await B2CUserModel.create(newB2CUserData);

        // --- Send Password Setup Email --- 
        try {
            // Call the email utility, passing the ORIGINAL (unhashed) token
            await sendPasswordSetupEmail(newB2CUser.email, newB2CUser.firstName, setupToken);
            console.log(`Password setup email initiated for ${newB2CUser.email}`);
        } catch (emailError) {
            console.error(`Failed to send password setup email to ${newB2CUser.email}:`, emailError);
            // CRITICAL DECISION: Should registration fail if email fails?
            // Option 1: Continue but log error (user created but can't set password easily)
            // Option 2: Return an error to the agent (more robust)
            // Option 3: Try to delete the just-created user (complex rollback)
            // For now, let's return an error to the agent (Option 2)
            // Clear the token fields as the email failed
            newB2CUser.passwordResetToken = undefined;
            newB2CUser.passwordResetExpires = undefined;
            await newB2CUser.save({ validateBeforeSave: false }); // Save without validation

            return next(new Error(`Customer created, but failed to send password setup email. Please contact support or try again later.`)); 
        }
        // ------------------------------- 

        // 5. Return success response
        const userToReturn = newB2CUser.toObject();
        delete userToReturn.password; 
        delete userToReturn.__v; 
        delete userToReturn.passwordResetToken; // Don't send token/expiry back
        delete userToReturn.passwordResetExpires;

        res.status(201).json({
            success: true,
            message: 'B2C customer registered successfully. Password setup email sent.',
            user: userToReturn
        });

    } catch (error) {
        console.error('Error during B2C customer registration:', error);
        // Use standard Error for Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            const err = new Error(messages.join(', '));
            err.statusCode = 400;
            return next(err);
        }
        // Ensure statusCode is set for other errors
        if (!error.statusCode) error.statusCode = 500;
        return next(error); 
    }
}; 