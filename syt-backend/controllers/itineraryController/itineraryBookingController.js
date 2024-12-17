// controllers/itineraryController/ItineraryBookingController.js
const mongoose = require('mongoose');
const ItineraryBooking = require('../../models/ItineraryBooking');

class ItineraryBookingController {
  // Create comprehensive booking
  async createBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        itineraryToken,
        inquiryToken,
        travelers,
        activityBookings,
        hotelBookings = [],
        transferBookings = [],
        flightBookings = [],
        prices,
        specialRequirements
      } = req.body;

      // Create initial booking record - keeping original booking statuses
      const booking = new ItineraryBooking({
        itineraryToken,
        inquiryToken,
        userId: req.user._id,
        travelers,
        prices,
        specialRequirements,
        status: 'pending',
        // Keep original activityBookings without modifying their status
        activityBookings,
        hotelBookings,
        transferBookings,
        flightBookings
      });

      // Determine overall booking status
      const hasBookings = 
        (activityBookings?.length > 0) ||
        (hotelBookings?.length > 0) ||
        (transferBookings?.length > 0) ||
        (flightBookings?.length > 0);

      if (!hasBookings) {
        booking.status = 'failed';
      }

      // Save booking
      await booking.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Respond with booking details
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      
      // Log the error
      console.error('Booking Creation Error:', error);

      // Send error response
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message
      });
    } finally {
      // End the session
      session.endSession();
    }
  }

  // Retrieve user bookings
  async getUserBookings(req, res) {
    try {
      const bookings = await ItineraryBooking.find({ 
        userId: req.user._id 
      })
      .sort('-bookingDate')
      .select('itineraryToken status prices bookingDate');

      res.status(200).json({
        success: true,
        results: bookings.length,
        data: bookings
      });
    } catch (error) {
      console.error('Get User Bookings Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bookings',
        error: error.message
      });
    }
  }

  // Get single booking details
  async getBooking(req, res) {
    try {
      const booking = await ItineraryBooking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Ensure user can only access their own bookings
      if (booking.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this booking'
        });
      }

      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Get Booking Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking',
        error: error.message
      });
    }
  }

  // Get booking status
  async getBookingStatus(req, res) {
    try {
      const booking = await ItineraryBooking.findOne({ 
        itineraryToken: req.params.itineraryToken,
        userId: req.user._id
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          status: booking.status,
          activityBookings: booking.activityBookings.map(activity => ({
            activityCode: activity.activityCode,
            status: activity.bookingStatus
          })),
          hotelBookings: booking.hotelBookings.map(hotel => ({
            hotelCode: hotel.hotelCode,
            status: hotel.bookingStatus
          })),
          transferBookings: booking.transferBookings.map(transfer => ({
            quotationId: transfer.quotationId,
            status: transfer.bookingStatus
          })),
          flightBookings: booking.flightBookings.map(flight => ({
            flightCode: flight.flightCode,
            status: flight.bookingStatus
          }))
        }
      });
    } catch (error) {
      console.error('Get Booking Status Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking status',
        error: error.message
      });
    }
  }
}

module.exports = new  ItineraryBookingController();