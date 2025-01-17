const Itinerary = require('../../models/Itinerary');
const { getGroundTransfer } = require("../transferController/transferControllerLA");
const apiLogger = require('../../helpers/apiLogger');
const TransferLockManager = require('../../services/transferServices/transferLockManager');
const TransferOrchestrationService = require('../../services/transferServices/transferOrchestrationService');
const FlightUtils = require('../../utils/flight/flightUtils');

// Helper function to format address to single line
function formatAddressToSingleLine(addressObj) {
  if (!addressObj) return null;

  const parts = [
    addressObj.line1,
    addressObj.city?.name,
    addressObj.country?.name,
    addressObj.postalCode ? `Postal Code ${addressObj.postalCode}` : null
  ];

  return parts.filter(Boolean).join(', ');
}

// Helper function to validate and format location data
function formatLocationForTransfer(location, type) {
  if (!location?.latitude || !location?.longitude) {
    throw new Error(`Missing geolocation data for ${type}`);
  }

  return {
    city: location.city,
    country: location.country,
    address: location.address,
    latitude: parseFloat(location.latitude),
    longitude: parseFloat(location.longitude),
  };
}

// Helper function to update transfers when hotel changes
async function updateTransfersForHotelChange(itinerary, cityName, date, newHotelDetails, inquiryToken) {
  try {
    console.log('Starting transfer update with:', {
      cityName,
      date,
      newHotelDetails: JSON.stringify(newHotelDetails, null, 2)
    });

    // Find the city and day indexes
    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) throw new Error('City not found');
    
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);
    if (dayIndex === -1) throw new Error('Day not found');

    const city = itinerary.cities[cityIndex];
    const day = city.days[dayIndex];

    console.log('Found city and day:', {
      cityIndex,
      dayIndex,
      currentTransfers: day.transfers
    });

    // Extract hotel geolocation from newHotelDetails
    const hotelGeolocation = newHotelDetails.hotelDetails.geolocation;
    const hotelAddress = newHotelDetails.hotelDetails.address;

    // Create new hotel location object
    const newHotelLocation = {
      city: cityName,
      country: hotelAddress.country.name,
      address: formatAddressToSingleLine(hotelAddress),
      latitude: hotelGeolocation.lat,
      longitude: hotelGeolocation.long
    };

    console.log('New hotel location:', newHotelLocation);

    const updatedTransfers = [...(day.transfers || [])];

    // If this is not the first city, update or create city_to_city transfer
    if (cityIndex > 0) {
      console.log('Processing city-to-city transfer for non-first city');
      
      const prevCity = itinerary.cities[cityIndex - 1];
      const prevCityLastDay = prevCity.days[prevCity.days.length - 1];
      const prevHotel = prevCityLastDay.hotels[0];

      console.log('Previous hotel details:', {
        prevCity: prevCity.city,
        prevHotel: prevHotel?.data?.hotelDetails ? 'exists' : 'not found'
      });

      if (prevHotel?.data?.hotelDetails) {
        const prevHotelLocation = {
          city: prevCity.city,
          country: prevHotel.data.hotelDetails.address.country.name,
          address: formatAddressToSingleLine(prevHotel.data.hotelDetails.address),
          latitude: prevHotel.data.hotelDetails.geolocation.lat,
          longitude: prevHotel.data.hotelDetails.geolocation.long
        };

        console.log('Previous hotel location:', prevHotelLocation);

        const cityToCityTransfer = await getGroundTransfer({
          travelers: itinerary.travelersDetails,
          inquiryToken: inquiryToken,
          preferences: {},
          startDate: new Date(date),
          origin: { type: "previous_hotel", ...prevHotelLocation },
          destination: { type: "current_hotel", ...newHotelLocation },
        });

        console.log('City to city transfer response:', cityToCityTransfer);

        if (cityToCityTransfer.type !== "error") {
          const existingTransferIndex = updatedTransfers.findIndex(t => t.type === "city_to_city");
          console.log('Existing transfer index:', existingTransferIndex);
          
          const newTransfer = {
            type: "city_to_city",
            details: cityToCityTransfer,
          };

          if (existingTransferIndex >= 0) {
            console.log('Updating existing transfer');
            updatedTransfers[existingTransferIndex] = newTransfer;
          } else {
            console.log('Adding new transfer');
            updatedTransfers.push(newTransfer);
          }
        }
      }
    }

    // First city, first day: Update airport_to_hotel transfer if exists
    if (cityIndex === 0 && dayIndex === 0 && day.flights?.length > 0) {
      console.log('Processing airport-to-hotel transfer');
      // ... rest of airport-to-hotel logic ...
    }

    // Last city, last day OR any day with departure flight: Update hotel_to_airport transfer
    const isLastCity = cityIndex === itinerary.cities.length - 1;
    const isLastDay = dayIndex === city.days.length - 1;
    
    if ((isLastCity && isLastDay && day.flights?.length > 0) || day.flights?.some(f => f.flightData)) {
      console.log('Processing hotel-to-airport transfer');
      const departureFlight = day.flights[day.flights.length - 1].flightData;
      console.log('Departure flight:', departureFlight);
      // ... rest of hotel-to-airport logic ...
    }

    console.log('Final updated transfers:', updatedTransfers);
    return updatedTransfers;
  } catch (error) {
    console.error('Error updating transfers:', error);
    throw error;
  }
}

exports.replaceHotel = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, newHotelDetails } = req.body; 
  const inquiryToken = req.headers['x-inquiry-token'];

  // Try to acquire lock
  if (!TransferLockManager.acquireLock(itineraryToken, cityName, date)) {
    return res.status(409).json({ 
      success: false,
      message: 'Another update is in progress for this hotel'
    });
  }

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

    // Find and update the hotel
    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);

    if (cityIndex === -1 || dayIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City or day not found in itinerary'
      });
    }

    // Update the hotel
    itinerary.cities[cityIndex].days[dayIndex].hotels = [{
      success: true,
      data: newHotelDetails,
      checkIn: newHotelDetails.checkIn,
      checkOut: newHotelDetails.checkOut,
      message: `Successfully booked ${newHotelDetails.hotelDetails.name}`
    }];

    let transferUpdateStatus = {
      success: true,
      message: null
    };

    // Update related transfers with better error handling
    try {
      const updatedTransfers = await TransferOrchestrationService.updateTransfersForHotelChange({
        itinerary,
        cityName,
        date,
        newHotelDetails,
        inquiryToken
      });

      // Replace the transfers for the day 
      itinerary.cities[cityIndex].days[dayIndex].transfers = updatedTransfers;
    } catch (transferError) {
      console.error('Error updating transfers:', transferError);
      transferUpdateStatus = {
        success: false,
        message: 'Hotel updated but transfers could not be updated automatically'
      };
    }

    // Save the updated itinerary
    const updatedItinerary = await itinerary.save();

    res.json({
      success: true,
      partialSuccess: !transferUpdateStatus.success,
      transferUpdateFailed: !transferUpdateStatus.success,
      message: transferUpdateStatus.message || 'Hotel and related transfers updated successfully',
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('Error replacing hotel and updating transfers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating hotel and transfers',
      error: error.message
    });
  } finally {
    // Always release the lock
    TransferLockManager.releaseLock(itineraryToken, cityName, date);
  }
};

exports.replaceActivity = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, oldActivityCode, newActivityDetails } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    const activities = itinerary.cities[cityIndex].days[dayIndex].activities;

    if (oldActivityCode) {
      // Replace existing activity
      const activityIndex = activities.findIndex(activity => 
        activity.activityCode === oldActivityCode
      );
      if (activityIndex === -1) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      activities[activityIndex] = newActivityDetails;
    } else {
      // Add new activity
      if (activities.length >= 3) {
        return res.status(400).json({ message: 'Maximum of 3 activities allowed per day' });
      }
      activities.push(newActivityDetails);
    }

    // Save the updated itinerary
    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    console.error('Error modifying activity:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: oldActivityCode ? 'replace-activity-error' : 'add-activity-error',
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
};

exports.removeActivity = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, activityCode } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-activity-request',
      requestData: { 
        itineraryToken, 
        activityCode 
      }
    });

    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    const activities = itinerary.cities[cityIndex].days[dayIndex].activities;
    const activityIndex = activities.findIndex(activity => 
      activity.activityCode === activityCode
    );

    if (activityIndex === -1) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Remove the activity
    activities.splice(activityIndex, 1);

    // Save the updated itinerary
    await itinerary.save();

    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-activity-success',
      responseData: { message: 'Activity removed successfully' }
    });

    res.json(itinerary);
  } catch (error) {
    console.error('Error removing activity:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-activity-error',
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
};


exports.updateActivityWithBookingRef = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, activityCode, bookingReference } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    const activityIndex = itinerary.cities[cityIndex].days[dayIndex].activities
      .findIndex(activity => activity.activityCode === activityCode);

    if (activityIndex === -1) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Update activity with booking reference
    itinerary.cities[cityIndex].days[dayIndex].activities[activityIndex].bookingReference = {
      bookingRef: bookingReference.bookingRef,
      priceValidUntil: bookingReference.priceValidUntil,
      timeElapsed: bookingReference.timeElapsed,
      supplierPrice: bookingReference.supplierPrice,
      price: bookingReference.price,
      availabilityValidUntil: bookingReference.availabilityValidUntil
    };

    await itinerary.save();
    res.json(itinerary);

  } catch (error) {
    console.error('Error updating activity with booking reference:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.replaceRoom = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, newHotelDetails } = req.body; 
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

    // Find and update the hotel
    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);

    if (cityIndex === -1 || dayIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City or day not found in itinerary'
      });
    }

    // Update the hotel's room details
    itinerary.cities[cityIndex].days[dayIndex].hotels = [{
      success: true,
      data: newHotelDetails,
      checkIn: newHotelDetails.checkIn,
      checkOut: newHotelDetails.checkOut,
      message: `Successfully updated room in ${newHotelDetails.hotelDetails.name}`
    }];

    // Save the updated itinerary
    const updatedItinerary = await itinerary.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('Error replacing room:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating room',
      error: error.message
    });
  }
};


exports.replaceFlight = async (req, res) => {
  const { itineraryToken } = req.params;
  const { 
    cityName, 
    date, 
    newFlightDetails,
    type // departure_flight, return_flight, inter_city_flight, etc.
  } = req.body;
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
    if (cityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City not found in itinerary'
      });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);
    if (dayIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Day not found in itinerary'
      });
    }

    // Prepare flight for storage
    const flightToStore = {
      type: type || 'departure_flight',
      flightData: newFlightDetails
    };

    // Update the flight for the specific day
    const currentDay = itinerary.cities[cityIndex].days[dayIndex];
    
    // If flights don't exist or we want to replace all flights
    currentDay.flights = [flightToStore];

    // Update related transfers
    try {
      const updatedTransfers = await TransferOrchestrationService.updateTransfersForChange({
        itinerary,
        changeType: 'FLIGHT_CHANGE',
        changeDetails: {
          cityName,
          date,
          newFlightDetails,
          type: type || 'departure_flight'
        },
        inquiryToken
      });

      // Replace the transfers for the day 
      currentDay.transfers = updatedTransfers;
    } catch (transferError) {
      console.error('Error updating transfers:', transferError);
      return res.status(200).json({
        success: true,
        partialSuccess: true,
        transferUpdateFailed: true,
        message: 'Flight updated but transfers could not be updated automatically',
        error: transferError.message
      });
    }

    // Validate flight data 
    try {
      // You might want to create a more comprehensive validation method
      if (!newFlightDetails.flightCode || !newFlightDetails.origin || !newFlightDetails.destination) {
        console.warn('Incomplete flight data:', newFlightDetails);
        // You can choose to throw an error or just log a warning
      }
    } catch (validationError) {
      console.warn('Flight data validation warning:', validationError.message);
    }

    // Save the updated itinerary
    const updatedItinerary = await itinerary.save();

    res.json({
      success: true,
      message: 'Flight and related transfers updated successfully',
      partialSuccess: false,
      transferUpdateFailed: false,
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('Error replacing flight:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating flight and transfers',
      error: error.message
    });
  }
};