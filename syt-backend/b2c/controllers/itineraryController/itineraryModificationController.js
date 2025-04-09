const Itinerary = require('../../models/Itinerary');
const { getGroundTransfer } = require("../transferController/transferControllerLA");
const apiLogger = require('../../../shared/helpers/apiLogger');
const TransferLockManager = require('../../../shared/services/transferServicesLA/transferLockManager');
const TransferOrchestrationService = require('../../../shared/services/transferServicesLA/transferOrchestrationService');
const FlightUtils = require('../../utils/flight/flightUtils');
const ItineraryBooking = require('../../models/ItineraryBooking')
const { v4: uuidv4 } = require('uuid'); // Import uuid if needed for fallback quotation_id

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

    const updatedHotel = itinerary.cities[cityIndex].days[dayIndex].hotels;
    // Save the updated itinerary
    await itinerary.save();

    res.json({
      success: true,
      partialSuccess: !transferUpdateStatus.success,
      transferUpdateFailed: !transferUpdateStatus.success,
      message: transferUpdateStatus.message || 'Hotel and related transfers updated successfully',
      updatedHotel: updatedHotel
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

// TODO: Add transfer recalculation logic similar to replaceHotel if removing a hotel affects transfers.
exports.removeHotel = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, hotelCode } = req.body; // Expect hotelCode to identify the hotel
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-hotel-request',
      requestData: { itineraryToken, hotelCode }
    });

    const itinerary = await Itinerary.findOne({ itineraryToken, inquiryToken });
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) return res.status(404).json({ message: 'City not found' });

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);
    if (dayIndex === -1) return res.status(404).json({ message: 'Day not found' });

    const hotels = itinerary.cities[cityIndex].days[dayIndex].hotels;
    const hotelIndex = hotels.findIndex(hotel => hotel.data?.items?.[0]?.code === hotelCode);

    if (hotelIndex === -1) return res.status(404).json({ message: 'Hotel not found on this day' });

    // Remove the hotel
    hotels.splice(hotelIndex, 1);

    // Mark the path as modified if necessary, though direct array ops might be handled.
    itinerary.markModified(`cities.${cityIndex}.days.${dayIndex}.hotels`);
    
    await itinerary.save();

    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-hotel-success',
      responseData: { message: 'Hotel removed successfully' }
    });

    res.json({ success: true, message: 'Hotel removed successfully', itinerary });
  } catch (error) {
    console.error('Error removing hotel:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-hotel-error',
      error: error.message
    });
    res.status(500).json({ success: false, message: 'Error removing hotel', error: error.message });
  }
};

// TODO: Add transfer recalculation logic similar to replaceFlight if removing a flight affects transfers.
exports.removeFlight = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, flightCode } = req.body; // Expect flightCode to identify the flight
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-flight-request',
      requestData: { itineraryToken, flightCode }
    });

    const itinerary = await Itinerary.findOne({ itineraryToken, inquiryToken });
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) return res.status(404).json({ message: 'City not found' });

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);
    if (dayIndex === -1) return res.status(404).json({ message: 'Day not found' });

    const flights = itinerary.cities[cityIndex].days[dayIndex].flights;
    // Use flightCode from flightData for matching
    const flightIndex = flights.findIndex(flight => flight.flightData?.flightCode === flightCode); 

    if (flightIndex === -1) return res.status(404).json({ message: 'Flight not found on this day' });

    // Remove the flight
    flights.splice(flightIndex, 1);

    itinerary.markModified(`cities.${cityIndex}.days.${dayIndex}.flights`);
    await itinerary.save();

    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-flight-success',
      responseData: { message: 'Flight removed successfully' }
    });

    res.json({ success: true, message: 'Flight removed successfully', itinerary });
  } catch (error) {
    console.error('Error removing flight:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-flight-error',
      error: error.message
    });
    res.status(500).json({ success: false, message: 'Error removing flight', error: error.message });
  }
};

exports.removeTransfer = async (req, res) => {
  const { itineraryToken } = req.params;
  // Use quotation_id as the primary identifier if available, fallback to type if needed.
  const { cityName, date, quotation_id, transferType } = req.body; 
  const inquiryToken = req.headers['x-inquiry-token'];

  if (!quotation_id && !transferType) {
      return res.status(400).json({ message: 'Missing transfer identifier (quotation_id or transferType)' });
  }

  try {
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-transfer-request',
      requestData: { itineraryToken, quotation_id, transferType }
    });

    const itinerary = await Itinerary.findOne({ itineraryToken, inquiryToken });
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) return res.status(404).json({ message: 'City not found' });

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);
    if (dayIndex === -1) return res.status(404).json({ message: 'Day not found' });

    const transfers = itinerary.cities[cityIndex].days[dayIndex].transfers;
    let transferIndex = -1;

    if (quotation_id) {
      transferIndex = transfers.findIndex(transfer => transfer.details?.quotation_id === quotation_id);
    } 
    // Optional: Fallback to type if quotation_id is not provided or not found (less reliable)
    // else if (transferType) {
    //   transferIndex = transfers.findIndex(transfer => transfer.type === transferType);
    // }

    if (transferIndex === -1) return res.status(404).json({ message: 'Transfer not found on this day using provided identifier' });

    // Remove the transfer
    transfers.splice(transferIndex, 1);

    itinerary.markModified(`cities.${cityIndex}.days.${dayIndex}.transfers`);
    await itinerary.save();

    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-transfer-success',
      responseData: { message: 'Transfer removed successfully' }
    });

    res.json({ success: true, message: 'Transfer removed successfully', itinerary });
  } catch (error) {
    console.error('Error removing transfer:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-transfer-error',
      error: error.message
    });
    res.status(500).json({ success: false, message: 'Error removing transfer', error: error.message });
  }
};

exports.updateActivityWithBookingRef = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, activityCode, bookingReference } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  // Comprehensive logging
  console.log('Received Booking Reference Update:', {
    itineraryToken,
    cityName,
    date,
    activityCode,
    bookingReference: JSON.stringify(bookingReference, null, 2)
  });

  try {
    // Find the itinerary
    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      console.error('Itinerary not found:', { itineraryToken, inquiryToken });
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Find the city
    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      console.error('City not found:', { 
        cityName, 
        availableCities: itinerary.cities.map(c => c.city) 
      });
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    // Find the day
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      console.error('Day not found:', { 
        date, 
        availableDates: itinerary.cities[cityIndex].days.map(d => d.date) 
      });
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    // Find the activity
    const activities = itinerary.cities[cityIndex].days[dayIndex].activities;
    const activityIndex = activities.findIndex(
      activity => activity.activityCode === activityCode
    );

    if (activityIndex === -1) {
      console.error('Activity not found:', { 
        activityCode, 
        availableActivityCodes: activities.map(a => a.activityCode) 
      });
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Prepare booking reference with robust parsing
    const processedBookingRef = {
      bookingRef: bookingReference.bookingRef || '',
      priceValidUntil: bookingReference.priceValidUntil 
        ? new Date(bookingReference.priceValidUntil) 
        : null,
      timeElapsed: bookingReference.timeElapsed || '',
      supplierPrice: bookingReference.supplierPrice || null,
      price: bookingReference.price || null,
      availabilityValidUntil: bookingReference.availabilityValidUntil && 
        bookingReference.availabilityValidUntil.trim()
        ? new Date(bookingReference.availabilityValidUntil)
        : null
    };

    // Log processed booking reference
    console.log('Processed Booking Reference:', JSON.stringify(processedBookingRef, null, 2));

    // Update the activity with booking reference
    itinerary.cities[cityIndex].days[dayIndex].activities[activityIndex].bookingReference = processedBookingRef;

    // Attempt to save the itinerary
    try {
      const updatedItinerary = await itinerary.save();

      // Log successful save
      console.log('Itinerary Updated Successfully', {
        updatedActivityBookingRef: JSON.stringify(
          updatedItinerary.cities[cityIndex].days[dayIndex].activities[activityIndex].bookingReference, 
          null, 
          2
        )
      });

      // Respond with the updated itinerary
      res.json(updatedItinerary);
    } catch (saveError) {
      // Detailed error logging
      console.error('Save Error Details:', {
        message: saveError.message,
        name: saveError.name,
        errors: saveError.errors,
        stack: saveError.stack
      });

      // Respond with error details
      res.status(500).json({ 
        message: 'Error saving itinerary', 
        error: saveError.message,
        details: saveError.errors
      });
    }

  } catch (error) {
    // Catch-all error handling
    console.error('Unexpected Error in updateActivityWithBookingRef:', error);
    res.status(500).json({ 
      message: 'Unexpected error updating activity booking reference',
      error: error.message 
    });
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

    const updatedFlight = currentDay.flights;
    // Save the updated itinerary
    await itinerary.save();

    res.json({
      success: true,
      message: 'Flight and related transfers updated successfully',
      partialSuccess: false,
      transferUpdateFailed: false,
      updatedFlight: updatedFlight
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

exports.updateFlightSeatsAndBaggage = async (req, res) => {
  const { itineraryToken } = req.params;
  const { flightCode, seatMap, baggageOptions, mealOptions } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    console.log('Updating flight seats and extras:', {
      itineraryToken,
      flightCode,
      seatMapLength: seatMap?.length,
      baggageOptionsLength: baggageOptions?.length,
      mealOptionsLength: mealOptions?.length
    });

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

    let flightFound = false;
    let updatedFlightData = null;

    // Search for the flight in the itinerary
    for (const city of itinerary.cities) {
      for (const day of city.days) {
        if (day.flights) {
          const flightIndex = day.flights.findIndex(
            flight => flight.flightData?.flightCode === flightCode
          );

          if (flightIndex !== -1) {
            const currentFlightData = day.flights[flightIndex].flightData;
            
            // Update the flight data by keeping all existing data and updating selections
            updatedFlightData = {
              ...currentFlightData,  // Preserve all existing flight data
              flightCode,
              selectedSeats: seatMap || null,
              selectedBaggage: baggageOptions || null,
              selectedMeal: mealOptions || null,
              isSeatSelected: Array.isArray(seatMap) && seatMap.length > 0,
              isBaggageSelected: Array.isArray(baggageOptions) && baggageOptions.length > 0,
              isMealSelected: Array.isArray(mealOptions) && mealOptions.length > 0
            };

            // Update the flight data
            day.flights[flightIndex] = {
              flightData: updatedFlightData
            };

            console.log('Updated flight data:', {
              flightCode,
              isSeatSelected: updatedFlightData.isSeatSelected,
              isBaggageSelected: updatedFlightData.isBaggageSelected,
              isMealSelected: updatedFlightData.isMealSelected
            });

            flightFound = true;
            break;
          }
        }
      }
      if (flightFound) break;
    }

    if (!flightFound) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found in itinerary'
      });
    }

    // Save the updated itinerary
    const updatedItinerary = await itinerary.save();

    // Add to change history
    if (!updatedItinerary.changeHistory) {
      updatedItinerary.changeHistory = [];
    }
    
    updatedItinerary.changeHistory.push({
      type: 'FLIGHT_CHANGE',
      details: {
        flightCode,
        changeType: 'SEATS_AND_EXTRAS_UPDATE',
        updatedFields: {
          seats: !!seatMap,
          baggage: !!baggageOptions,
          meal: !!mealOptions
        }
      }
    });

    await updatedItinerary.save();

    res.json({
      success: true,
      message: 'Flight seats, baggage, and meal updated successfully',
      flight: updatedFlightData
    });

  } catch (error) {
    console.error('Error updating flight seats, baggage, and meal:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating flight seats, baggage, and meal',
      error: error.message
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { 
    bookingId,
    itineraryToken, 
    cityName, 
    date, 
    bookingType, 
    bookingStatus,
    bookingResponse,
    activityCode,
    itineraryCode,
    code,
    quotation_id
  } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    // First, update Itinerary model
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

    const day = itinerary.cities[cityIndex].days[dayIndex];
    let updatePath;
    let updated = false;

    switch (bookingType) {
      case 'flight': {
        const flightIndex = day.flights.findIndex(
          flight => flight.flightData?.bookingDetails?.itineraryCode === itineraryCode
        );
        
        day.flights[flightIndex].flightData.bookingStatus = bookingStatus;
        updatePath = `cities.${cityIndex}.days.${dayIndex}.flights.${flightIndex}.flightData`;
        updated = true;
        break;
      }

      case 'hotel': {
        const hotelIndex = day.hotels.findIndex(
          hotel => hotel.data.code === code
        );

        day.hotels[hotelIndex].data.bookingStatus = bookingStatus;
        updatePath = `cities.${cityIndex}.days.${dayIndex}.hotels.${hotelIndex}.data`;
        updated = true;
        break;
      }

      case 'transfer': {
        const transferIndex = day.transfers.findIndex(
          transfer => transfer.details.quotation_id === quotation_id
        );

        day.transfers[transferIndex].details.bookingStatus = bookingStatus;
        updatePath = `cities.${cityIndex}.days.${dayIndex}.transfers.${transferIndex}.details`;
        updated = true;
        break;
      }

      case 'activity': {
        const activityIndex = day.activities.findIndex(
          activity => activity.activityCode === activityCode
        );

        day.activities[activityIndex].bookingStatus = bookingStatus;
        updatePath = `cities.${cityIndex}.days.${dayIndex}.activities.${activityIndex}`;
        updated = true;
        break;
      }
    }

    if (!updated) {
      throw new Error('Update operation did not complete');
    }

    itinerary.markModified(updatePath);
    await itinerary.save();

    // Simultaneously, update ItineraryBooking model
    const itineraryBooking = await ItineraryBooking.findOne({ bookingId });
    
    if (!itineraryBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    switch (bookingType) {
      case 'flight': {
        if (!bookingResponse?.data?.results?.details?.[0]) {
          return res.status(400).json({
            success: false,
            message: 'Invalid flight booking response'
          });
        }

        const flightDetails = bookingResponse.data.results.details[0];
        itineraryBooking.flights.push({
          bmsBookingCode: flightDetails.bmsBookingCode,
          pnr: flightDetails.pnr,
          bookingStatus: bookingStatus,
          traceId: flightDetails.traceId,
          itineraryCode: bookingResponse.data.results.itineraryCode,
          pnrDetails: flightDetails.pnrDetails,
          date,
          city: cityName
        });
        break;
      }

      case 'hotel': {
        if (!bookingResponse?.data?.results?.[0]?.data?.[0]) {
          return res.status(400).json({
            success: false,
            message: 'Invalid hotel booking response'
          });
        }

        const hotelData = bookingResponse.data.results[0];
        const roomData = hotelData.data[0];
        itineraryBooking.hotels.push({
          bookingRefId: roomData.bookingRefId,
          providerConfirmationNumber: roomData.providerConfirmationNumber,
          traceId: hotelData.traceId,
          code: hotelData.itineraryCode,
          status: bookingStatus,
          date,
          city: cityName,
          roomConfirmations: roomData.roomConfirmation.map(room => ({
            rateId: room.rateId,
            roomId: room.roomId,
            providerConfirmationNumber: room.providerConfirmationNumber
          }))
        });
        break;
      }

      case 'activity': {
        if (bookingResponse.offlineDetails) {
          itineraryBooking.activities.push({
            ...bookingResponse.offlineDetails,
            bookingStatus: bookingStatus,
            bookingReference: bookingResponse.offlineDetails.activityCode,
            date,
            city: cityName
          });
        } else {
          itineraryBooking.activities.push({
            bookingReference: bookingResponse.data.bookingReference,
            bookingStatus: bookingStatus,
            activityCode,
            searchId: bookingResponse.searchId,
            amount: bookingResponse.data.amount,
            date,
            city: cityName
          });
        }
        break;
      }

      case 'transfer': {
        itineraryBooking.transfers.push({
          booking_id: bookingResponse.data.data.booking_id,
          quotationId: quotation_id,
          status: bookingStatus,
          date,
          city: cityName
        });
        break;
      }
    }

    itineraryBooking.status = 'processing';
    await itineraryBooking.save();

    res.json({
      success: true,
      message: `${bookingType} booking status updated successfully`
    });

  } catch (error) {
    console.error(`Error updating ${bookingType} booking status:`, error);
    res.status(500).json({
      success: false,
      message: `Error updating ${bookingType} booking status`,
      error: error.message
    });
  }
};

// --- NEW: Add Hotel Controller Function --- 
exports.addHotel = async (req, res) => {
  const { itineraryToken } = req.params;
  const { 
    cityName,        // City to add the hotel to
    date,            // Check-in date (used to identify the day)
    newHotelDetails  // The complete hotel object payload (including rates, etc.)
  } = req.body; 
  const inquiryToken = req.headers['x-inquiry-token'];

  // Basic Validation
  if (!cityName || !date || !newHotelDetails) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: cityName, date, or newHotelDetails.' 
    });
  }

  try {
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'add-hotel-request',
      requestData: { itineraryToken, hotelName: newHotelDetails?.hotelDetails?.name }
    });

    const itinerary = await Itinerary.findOne({ itineraryToken, inquiryToken });
    if (!itinerary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Itinerary not found' 
      });
    }

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
        message: 'Day not found for the specified date in this city' 
      });
    }

    const day = itinerary.cities[cityIndex].days[dayIndex];

    // Ensure hotels array exists
    if (!Array.isArray(day.hotels)) {
      day.hotels = [];
    }

    // Add the new hotel object to the hotels array for that day
    day.hotels.push(newHotelDetails);

    // Mark the path as modified
    itinerary.markModified(`cities.${cityIndex}.days.${dayIndex}.hotels`);

    // TODO: Consider Transfer Updates - Should adding a hotel trigger transfer updates?
    // This might be complex if there's already a hotel. For now, just adding the hotel.
    // If transfers need update, call TransferOrchestrationService similar to replaceHotel.
    
    await itinerary.save();

    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'add-hotel-success',
      responseData: { 
        message: 'Hotel added successfully', 
        addedHotelName: newHotelDetails?.hotelDetails?.name 
      }
    });

    res.json({ 
      success: true, 
      message: 'Hotel added successfully to the itinerary', 
      // Optionally return the updated day or itinerary
      // updatedDay: day 
    });

  } catch (error) {
    console.error('Error adding hotel:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'add-hotel-error',
      error: error.message
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error adding hotel to the itinerary', 
      error: error.message 
    });
  }
};
// --- END: Add Hotel Controller Function ---

// Helper function to determine transfer type from origin/destination types
function determineTransferType(originType, destinationType) {
    if (!originType || !destinationType) {
        // Keep throwing error if types are completely missing
        throw new Error("Origin or destination type missing in transfer data.");
    }
    
    // Standardize types for comparison
    const originLower = originType.toLowerCase();
    const destLower = destinationType.toLowerCase();

    if (originLower.includes('hotel') && destLower.includes('airport')) {
        return 'hotel_to_airport';
    }
    if (originLower.includes('airport') && destLower.includes('hotel')) {
        return 'airport_to_hotel';
    }
    // Consider different hotel types for city_to_city (e.g., previous_hotel, current_hotel)
    if (originLower.includes('hotel') && destLower.includes('hotel')) {
         return 'city_to_city'; 
    }
    // Allow activity transfers
    if (originLower.includes('activity') || destLower.includes('activity')) {
         return 'activity_transfer'; 
    }
    
    return 'generic'; // Return a default type
    
}

// --- NEW: Add Transfer --- 
exports.addTransfer = async (req, res) => {
    const { itineraryToken } = req.params;
    const { 
        cityName, 
        date,       
        transferData, 
        quotation_id, 
        totalTravelers,
        flightNumber  
    } = req.body;
    const inquiryToken = req.headers['x-inquiry-token'];

    try {
        apiLogger.logApiData({
            inquiryToken,
            itineraryToken,
            apiType: 'b2c-add-transfer',
            requestData: { 
                cityName, 
                date, 
                transferDataType: transferData?.type, // Log quote type if exists
                quotation_id, 
                totalTravelers, // Log received travelers
                flightNumber 
            } 
        });

        // --- Input Validation (Add totalTravelers) --- 
        if (!cityName || !date || !transferData || !itineraryToken || !inquiryToken || !quotation_id || !totalTravelers) {
            return res.status(400).json({ success: false, message: "Missing required parameters (cityName, date, transferData, itineraryToken, inquiryToken, quotation_id, totalTravelers)." });
        }
        if (typeof totalTravelers !== 'number' || totalTravelers <= 0) {
            return res.status(400).json({ success: false, message: "Invalid 'totalTravelers' value. Expected a positive number." });
        }
        // ... other validations (transferData object, nested fields) ...


        // --- Fetch Itinerary (Still needed for context/saving) --- 
        const itinerary = await Itinerary.findOne({ itineraryToken, inquiryToken });
        if (!itinerary) {
            return res.status(404).json({ success: false, message: 'Itinerary not found' });
        }

        // --- Prepare Transfer Object --- 
        const outerTransferType = determineTransferType(transferData.origin?.type, transferData.destination?.type);

        // --- Create origin/destination with City field --- 
        const originForDetails = {
            ...(transferData.origin || {}),
            city: cityName // Ensure city field is present
        };
        const destinationForDetails = {
            ...(transferData.destination || {}),
            city: cityName // Ensure city field is present (might be different if跨city)
            // If destination city could differ, logic to determine it would be needed here.
            // Assuming for now destination city is same as origin context for this add operation.
        };
        // --------------------------------------------

        // 3. Construct Details Object (Use modified origin/destination)
        const detailsObject = {
            type: "ground",
            transportationType: "transfer",
            transferProvider: "LeAmigo", 
            bookingStatus: "pending",   
            selectedQuote: transferData, // Keep the full original quote data here
            totalTravelers: totalTravelers, 
            origin: originForDetails,       // Use object with city field
            destination: destinationForDetails, // Use object with city field
            quotation_id: quotation_id,       
            distance: transferData.routeDetails?.distance || null, 
            duration: transferData.routeDetails?.duration || null, 
        };

        // Add flightNumber if provided and relevant
        if (flightNumber && (outerTransferType === 'hotel_to_airport' || outerTransferType === 'airport_to_hotel')) {
            detailsObject.flightNumber = flightNumber;
        }
        
        // 4. Construct Final Transfer Object
        const finalTransferObject = {
            type: outerTransferType,
            details: detailsObject
        };

        // --- Find City and Day --- 
        const cityIndex = itinerary.cities.findIndex(c => c.city === cityName);
        if (cityIndex === -1) {
            return res.status(404).json({ success: false, message: `City '${cityName}' not found in itinerary.` });
        }
        const dayIndex = itinerary.cities[cityIndex].days.findIndex(d => d.date === date);
        if (dayIndex === -1) {
            return res.status(404).json({ success: false, message: `Date '${date}' not found in city '${cityName}'.` });
        }

        // --- Add Transfer to Itinerary --- 
        // Ensure transfers array exists
        if (!itinerary.cities[cityIndex].days[dayIndex].transfers) {
            itinerary.cities[cityIndex].days[dayIndex].transfers = [];
        }

        // Push the NEWLY CONSTRUCTED transfer object
        itinerary.cities[cityIndex].days[dayIndex].transfers.push(finalTransferObject);

        // --- Add Change History --- 
        itinerary.changeHistory.push({
            type: 'TRANSFER_ADD', 
            details: { 
                cityName, 
                date, 
                transferType: outerTransferType, // Log the determined type
                provider: detailsObject.transferProvider,
                quotation_id: quotation_id, // Log the specific quote ID
                numTravelersAdded: totalTravelers // Log the number added
            },
            changedAt: new Date()
        });

        // --- Save and Respond --- 
        const savedItinerary = await itinerary.save();

        apiLogger.logApiData({
            inquiryToken,
            itineraryToken,
            apiType: 'b2c-add-transfer-success',
            responseData: { 
                cityName, 
                date, 
                addedTransferType: outerTransferType,
                quotation_id: quotation_id,
                transferCount: savedItinerary.cities[cityIndex].days[dayIndex].transfers.length 
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Transfer added successfully with specified structure', 
            data: savedItinerary.cities[cityIndex].days[dayIndex].transfers // Return updated transfers array
        });

    } catch (error) {
        apiLogger.logApiData({
            inquiryToken,
            itineraryToken,
            apiType: 'b2c-add-transfer-error',
            requestBody: req.body, // Log body on error for debugging
            error: error.message,
            stack: error.stack // Include stack trace for better debugging
        });
        console.error('Error adding transfer to itinerary:', error);
        res.status(500).json({
            success: false,
            message: `Failed to add transfer to itinerary: ${error.message}`, // Include error message
            error: error.message // Keep original error message field
        });
    }
};
// --- END: Add Transfer ---