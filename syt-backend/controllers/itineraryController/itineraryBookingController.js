const mongoose = require('mongoose');
const ItineraryBooking = require('../../models/ItineraryBooking');

class BookingService {
  /**
   * Validate booking input
   * @param {Object} data - Booking input data
   * @throws {Error} If validation fails
   */
  static validateBookingInput(data) {
    const { rooms, itineraryToken, inquiryToken, userInfo } = data;

 // Check required tokens
 if (!itineraryToken || !inquiryToken) {
  throw new Error('Missing required booking tokens');
}

    // Validate userInfo
    if (!userInfo) {
      throw new Error('User information is required');
    }
  
    const requiredUserInfoFields = [
      'userId', 'firstName', 'lastName', 
      'email', 'phoneNumber'
    ];
  
    requiredUserInfoFields.forEach(field => {
      if (!userInfo[field]) {
        throw new Error(`Missing required user info field: ${field}`);
      }
    });

    // Validate rooms
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      throw new Error('Invalid or empty rooms configuration');
    }

    // Validate travelers in rooms
    rooms.forEach((room, roomIndex) => {
      if (!room.travelers || !Array.isArray(room.travelers) || room.travelers.length === 0) {
        throw new Error(`Room ${roomIndex + 1} must have at least one traveler`);
      }

      // Validate each traveler
      room.travelers.forEach((traveler, travelerIndex) => {
        const requiredFields = [
          'firstName', 'lastName', 'email', 'phone', 
          'dateOfBirth', 'nationality', 'passportNumber'
        ];

        requiredFields.forEach(field => {
          if (!traveler[field]) {
            throw new Error(`Traveler ${travelerIndex + 1} in Room ${roomIndex + 1} is missing ${field}`);
          }
        });
      });
    });
  }

  /**
   * Sanitize booking data
   * @param {Object} data - Raw booking data
   * @returns {Object} Sanitized booking data
   */
  static sanitizeBookingData(data) {
    return {
      ...data,
      userInfo: {
        userId: data.userInfo?.userId,
        firstName: data.userInfo?.firstName,
        lastName: data.userInfo?.lastName,
        email: data.userInfo?.email,
        phoneNumber: data.userInfo?.phoneNumber
      },
      rooms: data.rooms.map(room => ({
        ...room,
        travelers: room.travelers.map(traveler => {
          // Existing traveler sanitization logic
          const sanitizedTraveler = Object.fromEntries(
            Object.entries(traveler).filter(([, v]) => 
              v !== null && 
              v !== undefined && 
              v !== ''
            )
          );
  
          return {
            type: sanitizedTraveler.type || 'adult',
            gender: sanitizedTraveler.gender || 'male',
            ...sanitizedTraveler
          };
        })
      })),
      specialRequirements: data.specialRequirements?.trim() || null
    };
  }

  /**
   * Check for existing draft booking
   * @param {String} itineraryToken 
   * @param {String} userId 
   * @returns {Object|null} Existing draft booking
   */
  static async findExistingDraftBooking(itineraryToken, userId) {
    return ItineraryBooking.findOne({ 
      itineraryToken, 
      'userInfo.userId': userId,
      status: 'draft'
    });
  }

  /**
   * Create booking transaction
   * @param {Object} bookingData 
   * @param {Object} user 
   * @returns {Object} Created booking
   */
  static async createBookingTransaction(bookingData, user) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();
  
      // Create booking document - removed bookingId generation since it comes from client
      const booking = new ItineraryBooking({
        ...bookingData,
        status: 'draft',
        bookingDate: new Date(),
        userInfo: bookingData.userInfo || {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
  
      // Save booking
      await booking.save({ session });
  
      // Commit transaction
      await session.commitTransaction();
  
      return booking;
  
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  }
}

class ItineraryBookingController {
  /**
   * Create or update booking
   * @param {Object} req - Express request 
   * @param {Object} res - Express response
   */
  static async createBooking(req, res) {
    try {
      // Log the entire request body
      console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
  
      // Validate input
      BookingService.validateBookingInput(req.body);
  
      // Sanitize data
      const sanitizedData = BookingService.sanitizeBookingData(req.body);
  
      // Check for existing draft booking
      const existingBooking = await BookingService.findExistingDraftBooking(
        sanitizedData.itineraryToken, 
        sanitizedData.userInfo.userId
      );
  
      // If draft exists, update it
      if (existingBooking) {
        existingBooking.rooms = sanitizedData.rooms;
        existingBooking.specialRequirements = sanitizedData.specialRequirements;
        await existingBooking.save();
  
        return res.status(200).json({
          success: true,
          message: "Booking draft updated",
          data: { bookingId: existingBooking.bookingId }
        });
      }
  
      // Create new booking
      const newBooking = await BookingService.createBookingTransaction(
        sanitizedData, 
        req.user
      );
  
      console.log('Booking created:', {
        bookingId: newBooking.bookingId,
        userId: sanitizedData.userInfo.userId
      });
  
      // Respond with success
      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: { 
          bookingId: newBooking.bookingId,
          userInfo: newBooking.userInfo
        }
      });
  
    } catch (error) {
      console.error('Booking Creation Error:', {
        message: error.message,
        stack: error.stack
      });
  
      // Send error response
      return res.status(400).json({
        success: false,
        message: error.message || 'Booking creation failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get booking by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;

      // Find booking for the current user
      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      });

      // Check if booking exists
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Return booking details
      return res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      // Log error
      logger.error('Get booking by ID failed', {
        error: error.message,
        userId: req.user?._id,
        bookingId: req.params.bookingId
      });

      // Send error response
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get user's bookings
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async getUserBookings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        startDate, 
        endDate 
      } = req.query;

      // Build query
      const query = { 'userInfo.userId': req.user._id };
      
      // Apply status filter
      if (status) {
        query.status = status;
      }
      
      // Apply date range filter
      if (startDate && endDate) {
        query.bookingDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Fetch paginated bookings
      const bookings = await ItineraryBooking.find(query)
        .sort({ bookingDate: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit));

      // Count total matching documents
      const total = await ItineraryBooking.countDocuments(query);

      // Return paginated results
      return res.status(200).json({
        success: true,
        data: bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      // Log error
      logger.error('Get user bookings failed', {
        error: error.message,
        userId: req.user?._id
      });

      // Send error response
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve bookings',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Update booking status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async updateBookingStatus(req, res) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const { bookingId } = req.params;
      const { status } = req.body;

      // Find booking for the current user
      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      }).session(session);

      // Check if booking exists
      if (!booking) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Validate status transition
      const validStatusTransitions = {
        'draft': ['pending', 'cancelled'],
        'pending': ['processing', 'cancelled'],
        'processing': ['confirmed', 'failed', 'cancelled']
      };

      const currentStatus = booking.status;
      const allowedTransitions = validStatusTransitions[currentStatus] || [];

      if (!allowedTransitions.includes(status)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${status}`
        });
      }

      // Update status
      booking.status = status;
      await booking.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Log status change
      logger.info('Booking status updated', {
        bookingId,
        oldStatus: currentStatus,
        newStatus: status,
        userId: req.user._id
      });

      // Return updated booking
      return res.status(200).json({
        success: true,
        message: 'Booking status updated successfully',
        data: booking
      });
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      // Log error
      logger.error('Update booking status failed', {
        error: error.message,
        userId: req.user?._id,
        bookingId: req.params.bookingId
      });

      // Send error response
      return res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      // End session
      session.endSession();
    }
  }

  /**
   * Cancel booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async cancelBooking(req, res) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const { bookingId } = req.params;

      // Find booking for the current user
      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      }).session(session);

      // Check if booking exists
      if (!booking) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Prevent cancellation of certain statuses
      const nonCancellableStatuses = ['confirmed', 'cancelled', 'failed'];
      if (nonCancellableStatuses.includes(booking.status)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Cannot cancel booking in ${booking.status} status`
        });
      }

      // Update status to cancelled
      booking.status = 'cancelled';
      await booking.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Log cancellation
      logger.info('Booking cancelled', {
        bookingId,
        userId: req.user._id
      });

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking
      });
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      // Log error
      logger.error('Cancel booking failed', {
        error: error.message,
        userId: req.user?._id,
        bookingId: req.params.bookingId
      });

      // Send error response
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      // End session
      session.endSession();
    }
  }

  /**
   * Get booking statistics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async getBookingStats(req, res) {
    try {
      // Aggregate booking statistics
      const stats = await ItineraryBooking.aggregate([
        {
          $match: {
            'userInfo.userId': req.user._id
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);

      // Return statistics
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      // Log error
      logger.error('Get booking stats failed', {
        error: error.message,
        userId: req.user?._id
      });

      // Send error response
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking statistics',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = ItineraryBookingController;