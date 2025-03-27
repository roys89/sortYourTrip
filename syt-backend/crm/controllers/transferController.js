const TransferGetQuotesService = require('../../shared/services/transferServicesLA/transferGetQuotesService');
const TransferQuoteDetailsService = require('../../shared/services/transferServicesLA/transferQuoteDetailsService');
const TransferBookingService = require('../../shared/services/transferServicesLA/transferBookingService');
const TransferBookingDetailsService = require('../../shared/services/transferServicesLA/TransferBookingDetailsService');

const searchTransfers = async (req, res) => {
  try {
    const {
      origin,
      destination,
      pickupDate,
      pickupTime
    } = req.body;

    // Format pickup date and time
    const formattedPickupDate = `${pickupDate} ${pickupTime}:00.000`;

    // Call the transfer service to get quotes
    const quotes = await TransferGetQuotesService.getTransferQuotes({
      origin: {
        lat: origin.lat.toString(),
        long: origin.long.toString(),
        display_address: origin.display_address
      },
      destination: {
        lat: destination.lat.toString(),
        long: destination.long.toString(),
        display_address: destination.display_address
      },
      pickupDate: formattedPickupDate
    });

    res.json({
      success: true,
      quotes
    });
  } catch (error) {
    console.error('Error searching transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search transfers',
      error: error.message
    });
  }
};

const getTransferDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { quotationId, quoteId } = req.query;

    if (!quotationId || !quoteId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: quotationId and quoteId'
      });
    }

    // Call the transfer quote details service
    const response = await TransferQuoteDetailsService.getQuoteDetails(
      quotationId,
      quoteId,
      req.query.inquiryToken,
      req.query.cityName,
      req.query.startDate
    );

    if (response.success) {
      res.json({
        success: true,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: response.message || 'Failed to get transfer quote details',
        error: response.error
      });
    }
  } catch (error) {
    console.error('Error in getTransferDetails:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transfer details'
    });
  }
};

const bookTransfer = async (req, res) => {
  try {
    const {
      booking_date,
      booking_time,
      guest_details,
      quotation_id,
      quotation_child_id,
      comments,
      total_passenger,
      flight_number
    } = req.body;

    // Validate required fields
    if (!booking_date || !booking_time || !guest_details || !quotation_id || !quotation_child_id || !total_passenger) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate a random 8 character booking ID
    const bookingId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Prepare the booking data
    const bookingData = {
      transformedTransfer: {
        bookingArray: [{
          booking_date,
          booking_time,
          guest_details,
          quotation_id,
          quotation_child_id,
          comments,
          total_passenger,
          flight_number
        }]
      },
      inquiryToken: req.query.inquiryToken,
      cityName: req.query.cityName,
      date: req.query.date
    };

    // Validate booking data
    await TransferBookingService.validateBookingData(bookingData);

    // Call the transfer booking service
    const bookingResponse = await TransferBookingService.bookTransfer(bookingData);

    if (bookingResponse.success) {
      res.status(200).json({
        success: true,
        message: 'Transfer booked successfully',
        data: bookingResponse.data
      });
    } else {
      throw new Error(bookingResponse.error || 'Failed to book transfer');
    }

  } catch (error) {
    console.error('Error booking transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book transfer',
      error: error.message
    });
  }
};

const getBookingStatus = async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Call the transfer booking details service to get booking details
    const bookingResponse = await TransferBookingDetailsService.getBookingDetails({
      booking_id,
      inquiryToken: req.query.inquiryToken,
      date: req.query.date,
      city: req.query.cityName
    });

    if (bookingResponse.success) {
      res.json({
        success: true,
        data: bookingResponse.data
      });
    } else {
      throw new Error(bookingResponse.error || 'Failed to get booking details');
    }
  } catch (error) {
    console.error('Error in getBookingStatus:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get booking details'
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    // Implement booking cancellation logic
    res.json({ message: 'Booking cancellation endpoint' });
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to cancel booking'
    });
  }
};

module.exports = {
  searchTransfers,
  getTransferDetails,
  bookTransfer,
  getBookingStatus,
  cancelBooking
}; 