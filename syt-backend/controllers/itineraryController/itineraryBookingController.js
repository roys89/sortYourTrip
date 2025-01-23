const mongoose = require('mongoose');
const ItineraryBooking = require('../../models/ItineraryBooking');
const { AppError } = require('../../utils/errorHandling');

class ItineraryBookingController {
  static calculateOverallStatus(bookingData) {
    const statuses = [
      ...(bookingData.hotelBookings || []).map(h => h.bookingStatus),
      ...(bookingData.transferBookings || []).map(t => t.bookingStatus),
      ...(bookingData.activityBookings || []).map(a => a.bookingStatus),
      ...(bookingData.flightBookings || []).map(f => f.bookingStatus)
    ].filter(Boolean);

    if (!statuses.length) return "pending";
    
    if (statuses.includes("failed")) return "failed";
    if (statuses.every(s => s === "confirmed")) return "confirmed";
    if (statuses.includes("cancelled")) return "cancelled";
    if (statuses.some(s => s === "pending") && statuses.some(s => s === "confirmed")) return "processing";
    
    return "pending";
  }

  static async createBooking(req, res, next) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const bookingData = req.body;

      if (!bookingData.itineraryToken || !bookingData.inquiryToken) {
        throw new AppError("Missing required booking tokens", 400);
      }

      const existingBooking = await ItineraryBooking.findOne({
        bookingId: bookingData.bookingId
      });

      if (existingBooking) {
        throw new AppError("Booking already exists", 400);
      }

      const status = ItineraryBookingController.calculateOverallStatus(bookingData);

      const booking = new ItineraryBooking({
        ...bookingData,
        status,
        bookingDate: new Date()
      });

      await booking.save({ session });
      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getBookingById(req, res) {
    const { bookingId } = req.params;
    
    const booking = await ItineraryBooking.findOne({
      bookingId,
      'userInfo.userId': req.user._id
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    return res.status(200).json({
      success: true,
      data: booking
    });
  }

  static async getUserBookings(req, res) {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const query = { 'userInfo.userId': req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await ItineraryBooking.find(query)
      .sort({ bookingDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

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
  }

  static async updateBookingStatus(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const { bookingId } = req.params;
      const { status, component, componentId } = req.body;

      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (component && componentId) {
        switch (component) {
          case 'hotel':
            const hotel = booking.hotelBookings?.find(h => h.traceId === componentId);
            if (hotel) hotel.bookingStatus = status;
            break;
          case 'transfer':
            const transfer = booking.transferBookings?.find(t => t.transferId === componentId);
            if (transfer) transfer.bookingStatus = status;
            break;
          case 'activity':
            const activity = booking.activityBookings?.find(a => a.bookingRef === componentId);
            if (activity) activity.bookingStatus = status;
            break;
          case 'flight':
            const flight = booking.flightBookings?.find(f => f.flightCode === componentId);
            if (flight) flight.bookingStatus = status;
            break;
          default:
            throw new AppError("Invalid booking component", 400);
        }
      }

      booking.status = ItineraryBookingController.calculateOverallStatus(booking);
      await booking.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        data: booking
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async cancelBooking(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const { bookingId } = req.params;

      const booking = await ItineraryBooking.findOne({
        bookingId,
        'userInfo.userId': req.user._id
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (['confirmed', 'cancelled', 'failed'].includes(booking.status)) {
        throw new AppError(`Cannot cancel booking in ${booking.status} status`, 400);
      }

      const components = ['hotelBookings', 'transferBookings', 'activityBookings', 'flightBookings'];
      components.forEach(component => {
        if (booking[component]?.length) {
          booking[component].forEach(item => item.bookingStatus = 'cancelled');
        }
      });

      booking.status = 'cancelled';
      await booking.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getBookingStats(req, res) {
    const stats = await ItineraryBooking.aggregate([
      {
        $match: {
          'userInfo.userId': req.user._id
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

    return res.status(200).json({
      success: true,
      data: stats
    });
  }
}

module.exports = ItineraryBookingController;