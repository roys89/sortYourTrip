const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class UserController {
  // User Login
  async login(req, res) {
    const { email, password } = req.body;
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );

      // Convert user to object and remove password
      const userdata = user.toObject();
      delete userdata.password;

      res.status(200).json({
        success: true,
        token,
        user: userdata
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during login',
        error: error.message 
      });
    }
  }

  // User Registration
  async register(req, res) {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      confirmPassword, 
      dob, 
      country, 
      phoneNumber, 
      countryCode, 
      referralCode 
    } = req.body;

    try {
      // Validate password match
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        dob,
        country,
        phoneNumber,
        countryCode,
        referralCode,
      });

      await newUser.save();

      // Generate token
      const token = jwt.sign(
        { userId: newUser._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );

      // Convert user to object and remove password
      const userdata = newUser.toObject();
      delete userdata.password;

      res.status(201).json({
        success: true,
        token,
        user: userdata
      });
    } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message
      });
    }
  }

  // Check Auth Status
  async checkAuthStatus(req, res) {
    try {
      // Find user by ID (from auth middleware) and exclude password
      const user = await User.findById(req.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Auth Status Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during auth check',
        error: error.message
      });
    }
  }

  // User Logout
  async logout(req, res) {
    try {
      // Since we're using JWT, we don't need to do much server-side
      // The frontend will remove the token
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout',
        error: error.message
      });
    }
  }

  // Get User Profile
  async getUserProfile(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching profile',
        error: error.message
      });
    }
  }

  // Update User Profile
  async updateUserProfile(req, res) {
    const { 
      firstName, 
      lastName, 
      email, 
      dob, 
      country, 
      phoneNumber, 
      countryCode, 
      referralCode 
    } = req.body;

    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }

      // Update fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.dob = dob || user.dob;
      user.country = country || user.country;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.countryCode = countryCode || user.countryCode;
      user.referralCode = referralCode || user.referralCode;

      await user.save();

      // Convert to object and remove sensitive data
      const userdata = user.toObject();
      delete userdata.password;

      res.status(200).json({
        success: true,
        user: userdata
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating profile',
        error: error.message
      });
    }
  }

  // Change Password
  async changePassword(req, res) {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
      // Check if passwords match
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Change Password Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing password',
        error: error.message
      });
    }
  }

  // Password Reset Request
  async passwordResetRequest(req, res) {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // TODO: Send reset email with token
      // This would typically involve sending an email with a reset link

      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to email'
      });
    } catch (error) {
      console.error('Password Reset Request Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password reset request',
        error: error.message
      });
    }
  }

  // Reset Password
  async resetPassword(req, res) {
    const { token, newPassword, confirmPassword } = req.body;

    try {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      console.error('Password Reset Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password reset',
        error: error.message
      });
    }
  }

  // Get User's Itineraries
async getUserItineraries(req, res) {
  try {
    const itineraries = await Itinerary.find({ 'userInfo.userId': req.userId.toString() })
      .select('itineraryToken inquiryToken cities.city cities.startDate cities.endDate travelersDetails createdAt updatedAt')
      .lean();

    const simplifiedItineraries = itineraries.map(itinerary => ({
      itineraryToken: itinerary.itineraryToken,
      inquiryToken: itinerary.inquiryToken,
      createdAt: itinerary.createdAt,
      updatedAt: itinerary.updatedAt,
      travelersDetails: itinerary.travelersDetails,
      cities: itinerary.cities.map(city => ({
        city: city.city,
        startDate: city.startDate,
        endDate: city.endDate
      }))
    }));

    res.status(200).json({
      success: true,
      itineraries: simplifiedItineraries
    });
  } catch (error) {
    console.error('Get User Itineraries Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user itineraries',
      error: error.message
    });
  }
}

}

module.exports = new UserController();
