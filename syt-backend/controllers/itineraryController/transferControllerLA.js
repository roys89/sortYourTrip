// controllers/transferController.js
const TransferGetQuotesService = require('../../services/transferServices/transferGetQuoteSservice');
const TransferQuoteDetailsService = require('../../services/transferServices/transferQuoteDetailsService');

// Helper function to format date
const formatTransferDate = (dateStr) => {
  if (!dateStr) return null;
  // If it's already ISO string, return as is
  if (dateStr.includes('T')) return dateStr;
  
  // If it's just a date string, append time
  if (dateStr.includes('-')) {
    return `${dateStr}T00:00:00.000Z`;
  }
  
  // Handle other formats
  const date = new Date(dateStr);
  return date.toISOString();
};

exports.getGroundTransfer = async (transferData) => {
  try {
    // Calculate total number of travelers
    const totalTravelers = transferData.travelers.rooms.reduce((sum, room) => {
      const adultCount = room.adults.length;
      const childCount = room.children.length;
      return sum + adultCount + childCount;
    }, 0);

    // Format dates properly
    const pickupDate = formatTransferDate(transferData.startDate);
    const returnDate = new Date(new Date(pickupDate).getTime() + 24 * 60 * 60 * 1000).toISOString();

    if (!pickupDate) {
      throw new Error('Invalid pickup date format');
    }

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
      // Add flight number if available
      flightNumber: transferData.flightNumber
    };

    const quoteResponse = await TransferGetQuotesService.getTransferQuotes(quoteParams);

    if (quoteResponse.success) {
      const { data: quoteData } = quoteResponse.quotes;
      const quotes = quoteData.quotes;

      // Find the first vehicle with capacity >= totalTravelers
      const suitableQuote = quotes.find(
        (quote) => parseInt(quote.vehicle.capacity, 10) >= totalTravelers
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
          return {
            type: "ground",
            transportationType: "transfer",
            transferProvider: 'LeAmigo',
            selectedQuote: detailedQuoteResponse.data,
            totalTravelers,
            origin: quoteParams.origin,
            destination: quoteParams.destination,
            quotation_id: quoteData.quotation_id,
            distance: quoteData.distance,
            duration: quoteData.duration,
            flightNumber: transferData.flightNumber // Include flight number in response
          };
        }
      }
    }

    return {
      type: "error",
      message: "No suitable transfer found",
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