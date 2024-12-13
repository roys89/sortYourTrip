const airports = {
    'DXB': { city: 'Dubai', name: 'Dubai International Airport' },
    'AUH': { city: 'Abu Dhabi', name: 'Abu Dhabi International Airport' },
    'MCT': { city: 'Muscat', name: 'Muscat International Airport' },
    'FJR': { city: 'Fujairah', name: 'Fujairah International Airport' },
    'SHJ': { city: 'Sharjah', name: 'Sharjah International Airport' }
  };
  
  const airlines = [
    { code: 'EK', name: 'Emirates' },
    { code: 'EY', name: 'Etihad Airways' },
    { code: 'WY', name: 'Oman Air' },
    { code: 'FZ', name: 'Flydubai' },
    { code: 'G9', name: 'Air Arabia' }
  ];
  
  const generateFlightNumber = (airlineCode) => {
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${airlineCode}${number}`;
  };
  
  const generateFlightTime = (date, baseHour) => {
    const flightDate = new Date(date);
    flightDate.setHours(baseHour, Math.floor(Math.random() * 60));
    return flightDate;
  };
  
  const createDemoFlight = (departure, arrival, date) => {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = generateFlightNumber(airline.code);
    const departureTime = generateFlightTime(date, 10); // 10 AM base time
    
    // Calculate arrival time (1-3 hours later)
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(arrivalTime.getHours() + 1 + Math.floor(Math.random() * 2));
  
    return {
      flightNumber,
      airline: airline.name,
      departure: {
        airport: airports[departure].name,
        city: airports[departure].city,
        code: departure,
        terminal: Math.floor(Math.random() * 3) + 1,
        time: departureTime
      },
      arrival: {
        airport: airports[arrival].name,
        city: airports[arrival].city,
        code: arrival,
        terminal: Math.floor(Math.random() * 3) + 1,
        time: arrivalTime
      },
      duration: (arrivalTime - departureTime) / (1000 * 60), // Duration in minutes
      aircraft: 'Boeing 787-9',
      cabinClass: 'Business',
      price: Math.floor(Math.random() * 1000) + 500,
      currency: 'USD',
      bookingClass: 'J',
      seatsAvailable: Math.floor(Math.random() * 30) + 10
    };
  };
  
  const getFlightOptions = (departure, arrival, date) => {
    const flights = [];
    const numFlights = Math.floor(Math.random() * 3) + 2; // 2-4 flight options
  
    for (let i = 0; i < numFlights; i++) {
      flights.push(createDemoFlight(departure, arrival, date));
    }
  
    return flights;
  };
  
  module.exports = {
    getFlightOptions,
    createDemoFlight
  };