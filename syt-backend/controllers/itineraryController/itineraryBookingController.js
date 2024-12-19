const mongoose = require("mongoose");
const ItineraryBooking = require("../../models/ItineraryBooking");

class ItineraryBookingController {
  async createBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bookingData = req.body;

      // Validate required fields
      if (!bookingData.itineraryToken || !bookingData.inquiryToken) {
        throw new Error("Missing required booking tokens");
      }

      // Check for existing booking
      const existingBooking = await ItineraryBooking.findOne({
        itineraryToken: bookingData.itineraryToken,
        userId: req.user._id,
      });

      if (existingBooking) {
        throw new Error("Booking already exists for this itinerary");
      }

      // Create booking with user ID
      const booking = new ItineraryBooking({
        ...bookingData,
        userId: req.user._id,
        status: "pending",
      });

      // Save booking
      await booking.save({ session });

      // Commit transaction
      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
      });
    } catch (error) {
      await session.abortTransaction();

      res.status(error.status || 500).json({
        success: false,
        message: error.message || "Failed to create booking",
        error: error.stack,
      });
    } finally {
      session.endSession();
    }
  }

  async getBookings(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      // Build query
      const query = { userId: req.user._id };
      if (status) query.status = status;
      if (startDate && endDate) {
        query.bookingDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
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
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve bookings",
        error: error.message,
      });
    }
  }

  async getBooking(req, res) {
    try {
      const booking = await ItineraryBooking.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve booking",
        error: error.message,
      });
    }
  }

  async updateBookingStatus(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const { status, component, componentId } = req.body;

      const booking = await ItineraryBooking.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Update specific component status if provided
      if (component && componentId) {
        const validComponents = ["activity", "hotel", "transfer", "flight"];
        if (!validComponents.includes(component)) {
          throw new Error("Invalid booking component");
        }

        // Find and update the specific component
        switch (component) {
          case "activity":
            const activity = booking.activityBookings.find(
              (a) => a.bookingRef === componentId
            );
            if (activity) activity.bookingStatus = status;
            break;
          case "hotel":
            const hotel = booking.hotelBookings.find(
              (h) => h.hotelCode === componentId
            );
            if (hotel) hotel.bookingStatus = status;
            break;
          case "transfer":
            const transfer = booking.transferBookings.find(
              (t) => t.quotationId === componentId
            );
            if (transfer) transfer.bookingStatus = status;
            break;
          case "flight":
            const flight = booking.flightBookings.find(
              (f) => f.flightCode === componentId
            );
            if (flight) flight.bookingStatus = status;
            break;
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
        data: booking,
      });
    } catch (error) {
      await session.abortTransaction();

      res.status(error.status || 500).json({
        success: false,
        message: error.message || "Failed to update booking status",
        error: error.stack,
      });
    } finally {
      session.endSession();
    }
  }

  calculateOverallStatus(booking) {
    // Get all component statuses
    const statuses = [
      ...booking.activityBookings.map((a) => a.bookingStatus),
      ...booking.hotelBookings.map((h) => h.bookingStatus),
      ...booking.transferBookings.map((t) => t.bookingStatus),
      ...booking.flightBookings.map((f) => f.bookingStatus),
    ];

    if (statuses.length === 0) return "pending";

    // If any component failed, mark as failed
    if (statuses.includes("failed")) return "failed";

    // If all confirmed, mark as confirmed
    if (statuses.every((s) => s === "confirmed")) return "confirmed";

    // If any cancelled, mark as cancelled
    if (statuses.includes("cancelled")) return "cancelled";

    // If some pending and some confirmed, mark as processing
    if (statuses.includes("pending") && statuses.includes("confirmed"))
      return "processing";

    // Default to pending
    return "pending";
  }

  async cancelBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await ItineraryBooking.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Check if booking can be cancelled
      if (["confirmed", "cancelled", "failed"].includes(booking.status)) {
        throw new Error(`Cannot cancel booking in ${booking.status} status`);
      }

      // Update all component statuses to cancelled
      booking.activityBookings.forEach((a) => (a.bookingStatus = "cancelled"));
      booking.hotelBookings.forEach((h) => (h.bookingStatus = "cancelled"));
      booking.transferBookings.forEach((t) => (t.bookingStatus = "cancelled"));
      booking.flightBookings.forEach((f) => (f.bookingStatus = "cancelled"));

      // Update overall status
      booking.status = "cancelled";

      await booking.save({ session });
      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking,
      });
    } catch (error) {
      await session.abortTransaction();

      res.status(error.status || 500).json({
        success: false,
        message: error.message || "Failed to cancel booking",
        error: error.stack,
      });
    } finally {
      session.endSession();
    }
  }

  async getBookingStats(req, res) {
    try {
      const stats = await ItineraryBooking.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(req.user._id) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$prices.grandTotal" },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            totalAmount: { $round: ["$totalAmount", 2] },
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve booking statistics",
        error: error.message,
      });
    }
  }
}

module.exports = new ItineraryBookingController();