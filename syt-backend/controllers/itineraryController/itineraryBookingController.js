const mongoose = require("mongoose");
const ItineraryBooking = require("../../models/ItineraryBooking");
const { AppError } = require("../../utils/errorHandling");

class ItineraryBookingController {
  constructor() {
    // Bind methods to ensure correct 'this' context
    this.calculateOverallStatus = this.calculateOverallStatus.bind(this);
    this.createBooking = this.createBooking.bind(this);
    this.getBookings = this.getBookings.bind(this);
    this.getBookingByBookingId = this.getBookingByBookingId.bind(this);
    this.updateBookingStatus = this.updateBookingStatus.bind(this);
    this.cancelBooking = this.cancelBooking.bind(this);
    this.getBookingStats = this.getBookingStats.bind(this);
  }

  calculateOverallStatus(bookingData) {
    // Collect all component statuses
    const statuses = [
      ...(bookingData.hotelBookings || []).map(h => h.bookingStatus || 'pending'),
      ...(bookingData.transferBookings || []).map(t => t.bookingStatus || 'pending'),
      ...(bookingData.activityBookings || []).map(a => a.bookingStatus || 'pending'),
      ...(bookingData.flightBookings || []).map(f => f.bookingStatus || 'pending')
    ];

    if (!statuses.length) return "pending";
    
    // Detailed status calculation logic
    if (statuses.includes("failed")) return "failed";
    if (statuses.every(s => s === "confirmed")) return "confirmed";
    if (statuses.includes("cancelled")) return "cancelled";
    if (statuses.some(s => s === "pending") && statuses.some(s => s === "confirmed")) return "processing";
    
    return "pending";
  }

  async createBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bookingData = req.body;

      // Validate required tokens and bookingId
      if (!bookingData.itineraryToken || !bookingData.inquiryToken || !bookingData.bookingId) {
        throw new AppError("Missing required booking information", 400);
      }

      // Check for existing booking by bookingId
      const existingBooking = await ItineraryBooking.findOne({
        bookingId: bookingData.bookingId
      });

      if (existingBooking) {
        throw new AppError("Booking ID already exists", 400);
      }

      // Validate required travelers data
      if (!bookingData.travelers || !bookingData.travelers.length) {
        throw new AppError("Missing travelers information", 400);
      }

      // Validate at least one booking type exists
      if (
        !bookingData.hotelBookings?.length &&
        !bookingData.transferBookings?.length &&
        !bookingData.activityBookings?.length &&
        !bookingData.flightBookings?.length
      ) {
        throw new AppError("No booking items found", 400);
      }

      // Calculate overall booking status
      const status = this.calculateOverallStatus(bookingData);

      // Create booking with user ID and calculated status
      const booking = new ItineraryBooking({
        ...bookingData,
        userId: req.user._id,
        status: status,
        bookingDate: new Date()
      });

      // Save booking
      await booking.save({ session });

      // Commit transaction
      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking
      });
    } catch (error) {
      await session.abortTransaction();
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      
      console.error('Booking creation error:', error);
      
      res.status(500).json({
        success: false,
        message: "Failed to create booking",
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      // Build query
      const query = { userId: req.user._id };
      if (status) query.status = status;
      if (startDate && endDate) {
        query.bookingDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Execute query with pagination
      const bookings = await ItineraryBooking.find(query)
        .sort({ bookingDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v");

      // Get total count
      const total = await ItineraryBooking.countDocuments(query);

      res.status(200).json({
        success: true,
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve bookings",
        error: error.message
      });
    }
  }

  async getBookingByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      
      const booking = await ItineraryBooking.findOne({
        bookingId,
        userId: req.user._id
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve booking",
        error: error.message
      });
    }
  }

  async updateBookingStatus(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { bookingId } = req.params;
      const { status, component, componentId } = req.body;

      const booking = await ItineraryBooking.findOne({
        bookingId,
        userId: req.user._id
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      // Update specific component status
      if (component && componentId) {
        switch (component) {
          case "hotel":
            const hotel = booking.hotelBookings.find(h => h.traceId === componentId);
            if (hotel) hotel.bookingStatus = status;
            break;

          case "transfer":
            const transfer = booking.transferBookings.find(t => t.quotation_id === componentId);
            if (transfer) transfer.bookingStatus = status;
            break;

          case "activity":
            const activity = booking.activityBookings.find(a => a.bookingRef === componentId);
            if (activity) activity.bookingStatus = status;
            break;

          case "flight":
            const flight = booking.flightBookings.find(f => f.flightCode === componentId);
            if (flight) flight.bookingStatus = status;
            break;

          default:
            throw new AppError("Invalid booking component", 400);
        }
      }

      // Update overall booking status
      booking.status = this.calculateOverallStatus(booking);

      // Save changes
      await booking.save({ session });
      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        data: booking
      });
    } catch (error) {
      await session.abortTransaction();
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update booking status",
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  async cancelBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { bookingId } = req.params;

      const booking = await ItineraryBooking.findOne({
        bookingId,
        userId: req.user._id
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      // Check if booking can be cancelled
      if (["confirmed", "cancelled", "failed"].includes(booking.status)) {
        throw new AppError(`Cannot cancel booking in ${booking.status} status`, 400);
      }

      // Update all component statuses to cancelled
      booking.hotelBookings?.forEach(h => h.bookingStatus = "cancelled");
      booking.transferBookings?.forEach(t => t.bookingStatus = "cancelled");
      booking.activityBookings?.forEach(a => a.bookingStatus = "cancelled");
      booking.flightBookings?.forEach(f => f.bookingStatus = "cancelled");

      // Update overall status
      booking.status = "cancelled";

      await booking.save({ session });
      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking
      });
    } catch (error) {
      await session.abortTransaction();
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to cancel booking",
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  async getBookingStats(req, res) {
    try {
      const stats = await ItineraryBooking.aggregate([
        { 
          $match: { 
            userId: mongoose.Types.ObjectId(req.user._id) 
          } 
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$prices.grandTotal" }
          }
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            totalAmount: { $round: ["$totalAmount", 2] },
            _id: 0
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve booking statistics",
        error: error.message
      });
    }
  }
}

module.exports = new ItineraryBookingController();