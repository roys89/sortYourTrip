const CityAirport = require('../../models/CityAirport');

// Add prepareTransportRequest function
const prepareTransportRequest = (requestData) => {
  const defaultRequestData = {
    includeInternational: true,
    includeDetailedLandingInfo: true,
    transportationType: 'flight'
  };

  return { ...defaultRequestData, ...requestData };
};

// Helper function to get airport details
const getAirportDetails = async (destination_id) => {
  try {
    const airportInfo = await CityAirport.findOne({ destination_id });
    if (!airportInfo) {
      throw new Error(`No airport found for destination_id: ${destination_id}`);
    }
    return {
      name: airportInfo.name,
      iataCode: airportInfo.iata,
      city: airportInfo.city,
      country: airportInfo.country
    };
  } catch (error) {
    console.error(`Error fetching airport details: ${error.message}`);
    throw error;
  }
};

// Generate mock flight with airport details
const generateMockFlight = async ({ 
  departureCity, 
  arrivalCity, 
  departureTime, 
  arrivalTime, 
  travelers, 
  includeDetailedLandingInfo = false,
  transportationType = 'flight',
  type = ''
}) => {
  // Default location if geolocation is missing
  const defaultLocation = {
    latitude: 25.2567,
    longitude: 55.3643
  };

  // Get airport details for both departure and arrival cities
  const [departureAirport, arrivalAirport] = await Promise.all([
    getAirportDetails(departureCity.destination_id),
    getAirportDetails(arrivalCity.destination_id)
  ]);
  
  return {
    type,
    transportationType,
    flightCode: `${transportationType === 'flight' ? 'FL' : 'ALT'}-${departureAirport.iataCode}-${arrivalAirport.iataCode}`,
    
    origin: departureAirport.city,
    destination: arrivalAirport.city,
    
    originAirport: {
      name: departureAirport.name,
      code: departureAirport.iataCode,
      city: departureAirport.city,
      country: departureAirport.country,
      location: {
        latitude: departureCity.lat || defaultLocation.latitude,
        longitude: departureCity.long || defaultLocation.longitude
      }
    },
    
    arrivalAirport: {
      name: arrivalAirport.name,
      code: arrivalAirport.iataCode,
      city: arrivalAirport.city,
      country: arrivalAirport.country,
      location: {
        latitude: arrivalCity.lat || defaultLocation.latitude,
        longitude: arrivalCity.long || defaultLocation.longitude
      }
    },
    
    departureDate: departureTime.toISOString().split('T')[0],
    departureTime: departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    landingTime: includeDetailedLandingInfo ? arrivalTime.toISOString() : null,
    arrivalTime: arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    airline: transportationType === 'flight' ? 'Emirates' : 'Alternative Transport',
    flightDuration: transportationType === 'flight' ? '4h 15m' : (transportationType === 'ground' ? '8h' : '2h 30m'),
    price: transportationType === 'flight' ? 450 + Math.floor(Math.random() * 200) : (transportationType === 'ground' ? 150 : 250),
    
    travelers: travelers.rooms.map(room => ({
      adults: room.adults.length,
      children: room.children.length
    })),
    
    origin_location: {
      latitude: departureCity.lat || defaultLocation.latitude,
      longitude: departureCity.long || defaultLocation.longitude
    },
    
    destination_location: {
      latitude: arrivalCity.lat || defaultLocation.latitude,
      longitude: arrivalCity.long || defaultLocation.longitude
    },
    
    transportDetails: {
      type: transportationType,
      comfort: transportationType === 'flight' ? 'High' : (transportationType === 'ground' ? 'Medium' : 'Low'),
      amenities: transportationType === 'flight' ? ['Meals', 'Entertainment', 'Baggage'] : (transportationType === 'ground' ? ['Rest Stops', 'WiFi'] : ['Basic Transport'])
    }
  };
};

// Get flights with proper transport request preparation
const getFlights = async (requestData) => {
  const processedRequestData = prepareTransportRequest(requestData);
  
  const { 
    departureCity,
    cities,
    travelers,
    departureDates,
    includeDetailedLandingInfo = false,
    transportationType,
    includeInternational = true,
    returnDepartureCity
  } = processedRequestData;

  if (!includeInternational) {
    console.log('International travel is not included');
    return [];
  }

  if (!departureCity || !cities || !travelers || !departureDates) {
    throw new Error('Missing required flight request parameters');
  }

  try {
    const transportOptions = [];
    
    // Generate departure flight
    const firstDestination = cities[0];
    const departureTime = new Date(departureDates.startDate);
    departureTime.setHours(10, 0, 0);
    
    const firstArrivalTime = new Date(departureTime);
    firstArrivalTime.setHours(departureTime.getHours() + 4, 30, 0);
    
    const firstFlight = await generateMockFlight({
      departureCity,
      arrivalCity: firstDestination,
      departureTime,
      arrivalTime: firstArrivalTime,
      travelers,
      includeDetailedLandingInfo,
      transportationType: 'flight',
      type: 'departure_flight'
    });
    
    transportOptions.push(firstFlight);

    // Generate inter-city transport
    for (let i = 0; i < cities.length - 1; i++) {
      const currentCity = cities[i];
      const nextCity = cities[i + 1];
      
      const nextDepartureTime = new Date(firstArrivalTime);
      nextDepartureTime.setDate(nextDepartureTime.getDate() + 1);
      nextDepartureTime.setHours(10, 0, 0);
      
      const nextArrivalTime = new Date(nextDepartureTime);
      nextArrivalTime.setHours(nextDepartureTime.getHours() + 4, 30, 0);
      
      const currentTransportType = transportationType || 'flight';
      
      const subsequentTransport = await generateMockFlight({
        departureCity: currentCity,
        arrivalCity: nextCity,
        departureTime: nextDepartureTime,
        arrivalTime: nextArrivalTime,
        travelers,
        includeDetailedLandingInfo,
        transportationType: currentTransportType,
        type: 'inter_city_flight'
      });
      
      transportOptions.push(subsequentTransport);
    }

    // Generate return flight if needed
    if (returnDepartureCity) {
      const lastDestination = cities[cities.length - 1];
      const returnDepartureTime = new Date(departureDates.endDate);
      returnDepartureTime.setHours(10, 0, 0);
      
      const returnArrivalTime = new Date(returnDepartureTime);
      returnArrivalTime.setHours(returnDepartureTime.getHours() + 4, 30, 0);
      
      const returnFlight = await generateMockFlight({
        departureCity: lastDestination,
        arrivalCity: returnDepartureCity,
        departureTime: returnDepartureTime,
        arrivalTime: returnArrivalTime,
        travelers,
        includeDetailedLandingInfo,
        transportationType: 'flight',
        type: 'return_flight'
      });
      
      transportOptions.push(returnFlight);
    }

    return transportOptions;
  } catch (error) {
    console.error('Error generating flights:', error);
    throw error;
  }
};

module.exports = { 
  getFlights, 
  generateMockFlight,
  prepareTransportRequest,
  getAirportDetails 
};