const TransferGetQuotesService = require('../../services/transferServices/transferGetQuoteSservice');
const TransferQuoteDetailsService = require('../../services/transferServices/transferQuoteDetailsService');
const TransferBookingService = require('../../services/transferServices/transferBookingService');
const CurrencyService = require('../../services/currencyService');
const TransferBookingDetailsService = require('../../services/transferServices/TransferBookingDetailsService')

// Helper function to format date
const formatTransferDate = (dateStr) => {
  try {
    if (!dateStr) return null;

    // If dateStr is already a Date object, convert to ISO string
    if (dateStr instanceof Date) {
      return dateStr.toISOString();
    }

    // If it's a string, handle different formats
    if (typeof dateStr === 'string') {
      // If it's already ISO string, return as is
      if (dateStr.includes('T')) return dateStr;
      
      // If it's just a date string, append time
      if (dateStr.includes('-')) {
        return `${dateStr}T00:00:00.000Z`;
      }
    }
    
    // For any other format or type, try to create a new Date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toISOString();

  } catch (error) {
    console.error('Error formatting transfer date:', error, { dateStr });
    return new Date().toISOString(); // Fallback to current date
  }
};

exports.getGroundTransfer = async (transferData) => {
  try {
    console.log('Get ground transfer input:', {
      startDate: transferData.startDate,
      origin: transferData.origin,
      destination: transferData.destination
    });

    // Calculate total number of travelers
    const totalTravelers = transferData.travelers.rooms.reduce((sum, room) => {
      const adultCount = room.adults.length;
      const childCount = room.children.length;
      return sum + adultCount + childCount;
    }, 0);

    // Format dates properly
    const pickupDate = formatTransferDate(transferData.startDate);
    if (!pickupDate) {
      throw new Error('Invalid pickup date format');
    }

    // Calculate return date (24 hours after pickup)
    const returnDate = formatTransferDate(
      new Date(new Date(pickupDate).getTime() + 24 * 60 * 60 * 1000)
    );

    console.log('Formatted dates:', { pickupDate, returnDate });

    const quoteParams = {
      origin: {
        city: transferData.origin.city,
        display_address: transferData.origin.address,
        lat: transferData.origin.latitude.toString(),
        long: transferData.origin.longitude.toString(),
      },
      destination: {
        city: transferData.destination.city,
        display_address: transferData.destination.address,
        lat: transferData.destination.latitude.toString(),
        long: transferData.destination.longitude.toString(),
      },
      pickupDate,
      returnDate,
      inquiryToken: transferData.inquiryToken,
      travelers: transferData.travelers || { rooms: [{ adults: [1], children: [] }] },
      flightNumber: transferData.flightNumber
    };

    const quoteResponse = await TransferGetQuotesService.getTransferQuotes(quoteParams);

    if (quoteResponse.success) {
      const { data: quoteData } = quoteResponse.quotes;
      const quotes = quoteData.quotes;

      // Find the vehicle with capacity exactly equal to totalTravelers + 1
      const requiredCapacity = totalTravelers + 1;
      const suitableQuote = quotes.find(
        (quote) => parseInt(quote.vehicle.capacity, 10) >= requiredCapacity
      );

      if (suitableQuote) {
        const cityName = `${quoteParams.origin.city} to ${quoteParams.destination.city}`;
        
        const detailedQuoteResponse = await TransferQuoteDetailsService.getQuoteDetails(
          quoteData.quotation_id, 
          suitableQuote.quote_id,
          transferData.inquiryToken,
          cityName,
          transferData.startDate
        );

        if (detailedQuoteResponse.success) {
          const originalFare = detailedQuoteResponse.data.quote.fare;
      const originalCurrency = detailedQuoteResponse.data.currency;
       // Convert fare to INR
       const fareInINR = await CurrencyService.convertToINR(originalFare, originalCurrency);
      
       return {
        type: "ground",
        transportationType: "transfer",
        transferProvider: 'LeAmigo',
        bookingStatus: 'pending',
        selectedQuote: {
          ...detailedQuoteResponse.data,
          quote: {
            ...detailedQuoteResponse.data.quote,
            fare: fareInINR,
            currency: 'INR',
            currency_symbol: '₹'
          }
        },
        totalTravelers,
        origin: quoteParams.origin,
        destination: quoteParams.destination,
        quotation_id: quoteData.quotation_id,
        distance: quoteData.distance,
        duration: quoteData.duration,
        flightNumber: transferData.flightNumber
      };
    }
      }
    }

    return {
      type: "error",
      message: "No transfer vehicle with sufficient capacity found",
    };
  } catch (error) {
    console.error("Error in ground transfer processing:", error);
    return {
      type: "error",
      message: "Unexpected error in ground transfer processing",
      error: error.message,
    };
  }
};

exports.bookTransfer = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const transferData = req.body.transfer;

    if (!transferData) {
      return res.status(400).json({
        success: false,
        error: 'Transfer data is required',
        data: null
      });
    }

    // Validate booking ID match
    if (bookingId !== transferData.bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID mismatch',
        data: null
      });
    }

    // Validate booking data
    try {
      await TransferBookingService.validateBookingData({ transformedTransfer: transferData });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message,
        data: null
      });
    }

    // Prepare booking parameters
    const bookingParams = {
      transformedTransfer: transferData,
      cityName: transferData.type || 'Unknown',
      date: transferData.bookingArray[0].booking_date,
      inquiryToken: transferData.inquiryToken
    };

    // Book transfer
    const bookingResponse = await TransferBookingService.bookTransfer(bookingParams);

    // Return complete response maintaining the success flag
    res.status(200).json({
      success: bookingResponse.success,
      error: bookingResponse.error,
      data: bookingResponse.data
    });

  } catch (error) {
    console.error('Error in bookTransfer:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      data: error.response?.data || error // Include complete error response
    });
  }
};

exports.getTransferBookingDetails = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { inquiryToken, date, city } = req.body;

    if (!booking_id) {
      throw new Error('Booking ID is required');
    }

    const response = await TransferBookingDetailsService.getBookingDetails({
      booking_id,
      inquiryToken,
      date,
      city
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in getTransferBookingDetails:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      data: error.response?.data || error
    });
  }
};