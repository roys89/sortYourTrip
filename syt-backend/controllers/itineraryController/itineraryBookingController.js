const mongoose = require('mongoose');
const ItineraryBooking = require('../../models/ItineraryBooking');

class BookingService {
  static validateBookingInput(data) {
    const { 
      rooms, 
      itineraryToken, 
      inquiryToken, 
      userInfo, 
      totalAmount, 
      tcsRate, 
      tcsAmount 
    } = data;

    // Check required tokens
    if (!itineraryToken || !inquiryToken) {
      throw new Error('Missing required booking tokens');
    }

    // Payment validation
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      throw new Error('Invalid total amount');
    }

    if (typeof tcsRate !== 'number' || tcsRate < 0) {
      throw new Error('Invalid TCS rate');
    }

    if (typeof tcsAmount !== 'number' || tcsAmount < 0) {
      throw new Error('Invalid TCS amount');
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
      specialRequirements: data.specialRequirements?.trim() || null,
      totalAmount: Number(data.totalAmount),
      tcsRate: Number(data.tcsRate || 0),
      tcsAmount: Number(data.tcsAmount || 0),
      paymentStatus: 'pending',
      razorpay: {
        orderId: null,
        paymentId: null,
        signature: null
      }
    };
  }

  static async findExistingDraftBooking(itineraryToken, userId) {
    return ItineraryBooking.findOne({ 
      itineraryToken, 
      'userInfo.userId': userId,
      status: 'draft',
      paymentStatus: 'pending',
      'razorpay.paymentId': null
    });
  }

  static async createBookingTransaction(bookingData, user) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();
  
      const booking = new ItineraryBooking({
        ...bookingData,
        status: 'draft',
        paymentStatus: 'pending',
        paymentId: null,
        razorpay: {
          orderId: null,
          paymentId: null,
          signature: null
        },
        bookingDate: new Date(),
        userInfo: bookingData.userInfo || {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
  
      await booking.save({ session });
      await session.commitTransaction();
      return booking;
  
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

class ItineraryBookingController {
  static async createBooking(req, res) {
    try {
      console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
  
      BookingService.validateBookingInput(req.body);
      const sanitizedData = BookingService.sanitizeBookingData(req.body);
  
      const existingBooking = await BookingService.findExistingDraftBooking(
        sanitizedData.itineraryToken, 
        sanitizedData.userInfo.userId
      );
  
      if (existingBooking) {
        existingBooking.rooms = sanitizedData.rooms;
        existingBooking.specialRequirements = sanitizedData.specialRequirements;
        existingBooking.totalAmount = sanitizedData.totalAmount;
        existingBooking.tcsRate = sanitizedData.tcsRate;
        existingBooking.tcsAmount = sanitizedData.tcsAmount;
        await existingBooking.save();
  
        return res.status(200).json({
          success: true,
          message: "Booking draft updated",
          data: { bookingId: existingBooking.bookingId }
        });
      }
  
      const newBooking = await BookingService.createBookingTransaction(
        sanitizedData, 
        req.user
      );
  
      console.log('Booking created:', {
        bookingId: newBooking.bookingId,
        userId: sanitizedData.userInfo.userId
      });
  
      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: { 
          bookingId: newBooking.bookingId,
          userInfo: newBooking.userInfo,
          totalAmount: newBooking.totalAmount
        }
      });
  
    } catch (error) {
      console.error('Booking Creation Error:', {
        message: error.message,
        stack: error.stack
      });
  
      return res.status(400).json({
        success: false,
        message: error.message || 'Booking creation failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;
      
      // Added populate for payment details
      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      }).populate('paymentId');

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Get booking by ID failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getUserBookings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        paymentStatus,  // Added payment status filter
        startDate, 
        endDate 
      } = req.query;

      const query = { 'userInfo.userId': req.user._id };
      
      if (status) {
        query.status = status;
      }

      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }
      
      if (startDate && endDate) {
        query.bookingDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const bookings = await ItineraryBooking.find(query)
        .populate('paymentId')
        .sort({ bookingDate: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit));

      const total = await ItineraryBooking.countDocuments(query);

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
      console.error('Get user bookings failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve bookings',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async updateBookingStatus(req, res) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const { bookingId } = req.params;
      const { status } = req.body;

      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      }).session(session);

      if (!booking) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

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

      booking.status = status;
      await booking.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Booking status updated successfully',
        data: booking
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Update booking status failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      session.endSession();
    }
  }

  static async cancelBooking(req, res) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const { bookingId } = req.params;

      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      }).session(session);

      if (!booking) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Added payment status check
      const nonCancellableStatuses = ['confirmed', 'cancelled', 'failed'];
      if (nonCancellableStatuses.includes(booking.status) || 
          booking.paymentStatus === 'completed') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Cannot cancel booking in ${booking.status} status or after payment completion`
        });
      }

      booking.status = 'cancelled';
      booking.paymentStatus = 'failed';  // Update payment status on cancellation
      await booking.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Cancel booking failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      session.endSession();
    }
  }

  static async getBookingStats(req, res) {
    try {
      const stats = await ItineraryBooking.aggregate([
        {
          $match: {
            'userInfo.userId': req.user._id
          }
        },
        {
          $group: {
            _id: {
              status: "$status",
              paymentStatus: "$paymentStatus"
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" }
          }
        },
        {
          $project: {
            status: "$_id.status",
            paymentStatus: "$_id.paymentStatus",
            count: 1,
            totalAmount: 1,
            _id: 0
          }
        }
      ]);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get booking stats failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking statistics',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getBookingByItineraryToken(req, res) {
    try {
      const { itineraryToken } = req.params;
      
      const booking = await ItineraryBooking.findOne({
        itineraryToken,
        'userInfo.userId': req.user._id
      }).select('bookingId paymentStatus rooms specialRequirements');
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'No booking found for this itinerary'
        });
      }
  
      return res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Get booking by itinerary token failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
}

module.exports = ItineraryBookingController;