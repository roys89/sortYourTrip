const TransferOrchestrationService = require('../../services/transferServices/transferOrchestrationService');

exports.replaceFlight = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, newFlightDetails } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    // Find the itinerary
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

    // Find the specific city and day
    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);

    if (cityIndex === -1 || dayIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City or day not found in itinerary'
      });
    }

    // Determine flight type (arrival or departure)
    const flightType = newFlightDetails.type === 'departure_flight' 
      ? 'ARRIVAL_FLIGHT' 
      : 'DEPARTURE_FLIGHT';

    // Update the flight
    itinerary.cities[cityIndex].days[dayIndex].flights = [{
      flightData: newFlightDetails
    }];

    // Update transfers for flight change
    try {
      const transferUpdateParams = {
        itinerary,
        changeType: 'FLIGHT_CHANGE',
        changeDetails: {
          cityName,
          date,
          newFlightDetails,
          flightType
        },
        inquiryToken
      };

      const updatedTransfers = await TransferOrchestrationService.updateTransfersForChange(transferUpdateParams);

      // Replace the transfers for the day
      itinerary.cities[cityIndex].days[dayIndex].transfers = updatedTransfers;
    } catch (transferError) {
      console.error('Error updating transfers:', transferError);
      // Optionally log or handle transfer update failure
    }

    // Save the updated itinerary
    const updatedItinerary = await itinerary.save();

    res.json({
      success: true,
      message: 'Flight and related transfers updated successfully',
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('Error replacing flight and updating transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating flight and transfers',
      error: error.message
    });
  }
};