const FlightAuthService = require('../../services/flightServices/flightAuthService');
const FlightSearchService = require('../../services/flightServices/flightSearchService');
const ItineraryInquiry = require('../../models/ItineraryInquiry');
const Itinerary = require('../../models/Itinerary');
const TransferOrchestrationService = require('../../services/transferServices/transferOrchestrationService');

// Helper function to get unique airlines
function getUniqueAirlines(flights) {
  const airlineMap = new Map();
  
  flights.forEach(flight => {
    const airline = flight.sg[0].al.alN;
    const count = airlineMap.get(airline) || 0;
    airlineMap.set(airline, count + 1);
  });

  return Array.from(airlineMap, ([name, count]) => ({ name, count }));
}

// Helper function to get unique stops
function getUniqueStops(flights) {
  const stopsMap = new Map();
  
  flights.forEach(flight => {
    const stops = flight.sg.length - 1;
    const count = stopsMap.get(stops) || 0;
    stopsMap.set(stops, count + 1);
  });

  return Array.from(stopsMap, ([stops, count]) => ({ 
    stops, 
    label: stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`, 
    count 
  }));
}

// Helper function to calculate flight duration
function calculateFlightDuration(flight) {
  return flight.sg.reduce((total, segment) => total + (segment.dr || 0), 0);
}

module.exports = {
  searchAvailableFlights: async (req, res) => {
    const { inquiryToken } = req.params;
    const { 
      origin, 
      destination, 
      departureDate,
      type = 'flight',
      oldFlightCode,
      existingFlightPrice,
      travelersDetails
    } = req.body;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    try {
      // Validate required parameters
      if (!inquiryToken || !origin || !destination || !departureDate) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required flight search parameters" 
        });
      }

      // Find and validate inquiry
      const inquiry = await ItineraryInquiry.findOne({ 
        itineraryInquiryToken: inquiryToken 
      });

      if (!inquiry) {
        return res.status(404).json({ 
          success: false,
          message: "Itinerary inquiry not found" 
        });
      }

      // Authenticate and get flight search token
      const authResponse = await FlightAuthService.login(inquiryToken);
      if (!authResponse.success) {
        return res.status(401).json({
          success: false,
          message: "Flight authentication failed"
        });
      }

      const token = authResponse.token;
      
      // Prepare search parameters
      const searchParams = {
        departureCity: {
          city: origin.city,
          iata: origin.code,
          country: origin.country,
          location: {
            latitude: origin.location?.latitude,
            longitude: origin.location?.longitude
          }
        },
        arrivalCity: {
          city: destination.city,
          iata: destination.code,
          country: destination.country,
          location: {
            latitude: destination.location?.latitude,
            longitude: destination.location?.longitude
          }
        },
        date: departureDate,
        travelers: travelersDetails,
        inquiryToken,
        type,
        token,
        context: {
          oldFlightCode,
          existingFlightPrice: Number(existingFlightPrice)
        }
      };

      // Search for flights
      const searchResponse = await FlightSearchService.searchFlights(searchParams);

      if (!searchResponse.success) {
        return res.status(400).json({
          success: false,
          message: searchResponse.error || "Flight search failed"
        });
      }

      // Filter flights by duration
      const validDurationFlights = searchResponse.data.results.outboundFlights.filter((flight) => {
        const totalDuration = calculateFlightDuration(flight);
        return totalDuration <= 24 * 60; // 24 hours in minutes
      });

      // Sort and remove price outliers
      const sortedFlights = [...validDurationFlights].sort((a, b) => a.pF - b.pF);
      const totalFlights = sortedFlights.length;

      // Paginate flights
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFlights = sortedFlights.slice(startIndex, endIndex);

      // Prepare response with pagination
      res.json({
        success: true,
        data: {
          flights: paginatedFlights,
          traceId: searchResponse.data.traceId,
          isDomestic: searchResponse.data.isDomestic,
          totalTravelers: searchResponse.data.paxCount,
          pagination: {
            page,
            limit,
            total: totalFlights,
            hasMore: endIndex < totalFlights
          },
          context: {
            oldFlightCode,
            existingFlightPrice: Number(existingFlightPrice)
          },
          facets: {
            airlines: getUniqueAirlines(paginatedFlights),
            stops: getUniqueStops(paginatedFlights)
          }
        }
      });

    } catch (error) {
      console.error('Flight Search Error:', error);
      res.status(500).json({
        success: false, 
        message: "Unexpected error during flight search",
        error: error.message
      });
    }
  },

  replaceFlight: async (req, res) => {
    const { itineraryToken } = req.params;
    const { cityName, date, newFlightDetails } = req.body;
    const inquiryToken = req.headers['x-inquiry-token'];

    try {
      const itinerary = await Itinerary.findOne({ 
        itineraryToken,
        inquiryToken 
      });

      if (!itinerary) {
        return res.status(404).json({
          success: false,
          message: 'Itinerary not found'
        });
      }

      const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
      const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);

      if (cityIndex === -1 || dayIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'City or day not found'
        });
      }

      // Update the flight
      itinerary.cities[cityIndex].days[dayIndex].flights = [{
        flightData: newFlightDetails
      }];

      // Update related transfers
      try {
        const updatedTransfers = await TransferOrchestrationService.updateTransfersForChange({
          itinerary,
          changeType: 'FLIGHT_CHANGE',
          changeDetails: {
            cityName,
            date,
            newFlightDetails
          },
          inquiryToken
        });

        itinerary.cities[cityIndex].days[dayIndex].transfers = updatedTransfers;
      } catch (transferError) {
        console.error('Error updating transfers:', transferError);
        return res.status(200).json({
          success: true,
          partialSuccess: true,
          transferUpdateFailed: true,
          message: 'Flight updated but transfers could not be updated automatically'
        });
      }

      const updatedItinerary = await itinerary.save();

      res.json({
        success: true,
        message: 'Flight and transfers updated successfully',
        itinerary: updatedItinerary
      });

    } catch (error) {
      console.error('Error replacing flight:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};


module.exports.replaceFlight = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, newFlightDetails } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);

    if (cityIndex === -1 || dayIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City or day not found'
      });
    }

    // Update the flight
    itinerary.cities[cityIndex].days[dayIndex].flights = [{
      flightData: newFlightDetails
    }];

    // Update related transfers
    try {
      const updatedTransfers = await TransferOrchestrationService.updateTransfersForChange({
        itinerary,
        changeType: 'FLIGHT_CHANGE',
        changeDetails: {
          cityName,
          date,
          newFlightDetails
        },
        inquiryToken
      });

      itinerary.cities[cityIndex].days[dayIndex].transfers = updatedTransfers;
    } catch (transferError) {
      console.error('Error updating transfers:', transferError);
      return res.status(200).json({
        success: true,
        partialSuccess: true,
        transferUpdateFailed: true,
        message: 'Flight updated but transfers could not be updated automatically'
      });
    }

    const updatedItinerary = await itinerary.save();

    res.json({
      success: true,
      message: 'Flight and transfers updated successfully',
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('Error replacing flight:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};