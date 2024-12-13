// controllers/transferController.js
const TransferGetQuotesService = require('../../services/transferServices/transferGetQuoteSservice');

exports.getGroundTransfer = async (transferData) => {
  try {
    // Calculate total number of travelers
    const totalTravelers = transferData.travelers.rooms.reduce((sum, room) => {
      const adultCount = room.adults.length;
      const childCount = room.children.length;
      return sum + adultCount + childCount;
    }, 0);

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
      pickupDate: transferData.startDate,
      returnDate: new Date(
        new Date(transferData.startDate).getTime() + 24 * 60 * 60 * 1000
      ).toISOString(),
      inquiryToken: transferData.inquiryToken,
      travelers: transferData.travelers || { rooms: [{ adults: [1], children: [] }] },
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
        return {
          type: "ground",
          selectedQuote: suitableQuote,
          totalTravelers,
          origin: quoteParams.origin,
          destination: quoteParams.destination,
          quotation_id: quoteData.quotation_id,
          distance: quoteData.distance,
          duration: quoteData.duration,
          logDetails: quoteResponse.logDetails,
        };
      } else {
        return {
          type: "error",
          message: "No vehicle found with sufficient capacity for the travelers",
        };
      }
    } else {
      return {
        type: "error",
        message: "Unable to fetch ground transfer quotes",
        error: quoteResponse.error,
      };
    }
  } catch (error) {
    console.error("Error in ground transfer processing:", error);
    return {
      type: "error",
      message: "Unexpected error in ground transfer processing",
      error: error.message,
    };
  }
};