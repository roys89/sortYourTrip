// src/utils/bookingDataTransformer.js

// Utility function to generate unique IDs
export const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 9);
  };
  
  // Generate agent reference number
  export const generateAgentReference = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Generate question answers for travelers
  export const generateQuestionAnswers = (travelers, specialRequirements = '') => {
    const answers = travelers.flatMap((traveler, index) => [
      {
        question: "AGEBAND",
        answer: calculateAge(traveler.dateOfBirth) >= 12 ? "ADULT" : "CHILD",
        travelerNum: (index + 1).toString()
      },
      {
        question: "DATE_OF_BIRTH",
        answer: traveler.dateOfBirth,
        travelerNum: (index + 1).toString()
      },
      {
        question: "FULL_NAMES_FIRST",
        answer: traveler.firstName,
        travelerNum: (index + 1).toString()
      },
      {
        question: "FULL_NAMES_LAST",
        answer: traveler.lastName,
        travelerNum: (index + 1).toString()
      },
      {
        question: "WEIGHT",
        answer: traveler.weight,
        unit: "kg",
        travelerNum: (index + 1).toString()
      },
      {
        question: "HEIGHT",
        answer: traveler.height,
        unit: "cm",
        travelerNum: (index + 1).toString()
      }
    ]);
  
    // Add special requirement if exists
    if (specialRequirements) {
      answers.push({
        question: "SPECIAL_REQUIREMENTS",
        answer: specialRequirements
      });
    }
  
    // Add default pickup and transfer mode
    answers.push(
      {
        question: "PICKUP_POINT",
        answer: "CONTACT_SUPPLIER_LATER"
      },
      {
        question: "TRANSFER_ARRIVAL_MODE",
        answer: "OTHER"
      }
    );
  
    return answers;
  };
  
  // Transform travelers data
  export const transformTravelers = (travelers) => {
    return travelers.map(traveler => ({
      ...traveler,
      type: parseInt(traveler.age) >= 12 ? 'AD' : 'CH'
    }));
  };
  
  // Transform activity bookings
  export const transformActivityBookings = (bookingItinerary, travelers, specialRequirements) => {
    return (bookingItinerary.cities || []).flatMap(city => 
      (city.days || []).flatMap(day => 
        (day.activities || [])
          .filter(activity => activity.activityType === 'online')
          .map(activity => {
            const bookingRef = activity.bookingReference?.bookingRef || `BR-${Date.now()}-${generateUniqueId()}`;
            const activityCode = activity.activityCode || `ACT-${generateUniqueId()}`;
            
            return {
              searchId: activity.searchId || generateUniqueId(),
              bookingRef,
              activityCode,
              bookingStatus: 'pending',
              lead: {
                title: travelers[0].title,
                name: travelers[0].firstName,
                surname: travelers[0].lastName,
                clientNationality: travelers[0].nationality,
                age: parseInt(travelers[0].age)
              },
              agentRef: generateAgentReference(),
              rateKey: `${activity.packageDetails?.rateKey || generateUniqueId()}|${bookingRef}`,
              fromDate: day.date,
              toDate: day.date,
              groupCode: activity.groupCode,
              hotelId: null,
              languageGuide: {
                type: "GUIDE",
                language: "en",
                legacyGuide: "en/SERVICE_GUIDE"
              },
              QuestionAnswers: generateQuestionAnswers(travelers, specialRequirements),
              travellers: travelers.map(traveler => ({
                title: traveler.title,
                name: traveler.firstName,
                surname: traveler.lastName,
                type: parseInt(traveler.age) >= 12 ? 'AD' : 'CH',
                age: traveler.age
              })),
              amount: activity.packageDetails?.amount || 0
            };
          })
      )
    );
  };
  
  // Transform hotel bookings
  export const transformHotelBookings = (bookingItinerary, travelers) => {
    if (!bookingItinerary.hotels?.length) return [];
  
    return bookingItinerary.hotels.map(hotel => ({
      searchId: hotel.searchId || generateUniqueId(),
      hotelCode: hotel.hotelCode || `HTL-${generateUniqueId()}`,
      cityCode: hotel.cityCode,
      groupCode: hotel.groupCode || generateUniqueId(),
      rateKey: hotel.rateKey || generateUniqueId(),
      checkout: hotel.checkout,
      checkin: hotel.checkin,
      bookingStatus: 'pending',
      bookingResponse: null,
      amount: hotel.amount || 0,
      bookingItems: [{
        roomCode: hotel.roomCode || generateUniqueId(),
        rateKey: hotel.rateKey || generateUniqueId(),
        roomReference: generateUniqueId(),
        rooms: [{
          paxes: travelers.map(traveler => ({
            title: traveler.title,
            name: traveler.firstName,
            surname: traveler.lastName,
            type: parseInt(traveler.age) >= 12 ? 'AD' : 'CH',
            age: traveler.age
          }))
        }]
      }]
    }));
  };
  
  // Transform transfer bookings
  export const transformTransferBookings = (bookingItinerary, travelers) => {
    if (!bookingItinerary.transfers?.length) return [];
  
    return bookingItinerary.transfers.map(transfer => ({
      quotationId: transfer.quotationId || generateUniqueId(),
      bookingDate: transfer.bookingDate || bookingItinerary.startDate,
      bookingTime: transfer.bookingTime || "12:00",
      returnDate: transfer.returnDate || bookingItinerary.endDate,
      returnTime: transfer.returnTime || "12:00",
      totalPassenger: travelers.length,
      bookingStatus: 'pending',
      bookingResponse: null,
      amount: transfer.amount || 0,
      quotationChildId: transfer.quotationChildId,
      comments: transfer.comments || "Transfer booking",
      flightNumber: transfer.flightNumber
    }));
  };
  
  // Transform flight bookings
  export const transformFlightBookings = (bookingItinerary, travelers) => {
    if (!bookingItinerary.flights?.length) return [];
  
    return bookingItinerary.flights.map(flight => ({
      flightCode: flight.flightCode || `FL-${generateUniqueId()}`,
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      returnFlightCode: flight.returnFlightCode,
      returnDepartureDate: flight.returnDepartureDate,
      returnDepartureTime: flight.returnDepartureTime,
      bookingStatus: 'pending',
      bookingResponse: null,
      amount: flight.amount || 0,
      passengers: travelers.map(traveler => ({
        firstName: traveler.firstName,
        lastName: traveler.lastName,
        dateOfBirth: traveler.dateOfBirth,
        passportNumber: traveler.passportNumber,
        nationality: traveler.nationality,
        type: parseInt(traveler.age) >= 12 ? 'ADULT' : 'CHILD'
      }))
    }));
  };
  
  // Calculate prices
  export const calculatePrices = (bookingItinerary, activityBookings) => {
    const activityTotal = activityBookings.reduce((total, activity) => 
      total + (activity.amount || 0), 0
    );
  
    const hotelTotal = bookingItinerary.priceTotals?.hotels || 0;
    const flightTotal = bookingItinerary.priceTotals?.flights || 0;
    const transferTotal = bookingItinerary.priceTotals?.transfers || 0;
    
    const subtotal = activityTotal + hotelTotal + flightTotal + transferTotal;
    const tcsRate = bookingItinerary.priceTotals?.tcsRate || 0;
    const tcsAmount = (subtotal * tcsRate) / 100;
    
    return {
      activities: activityTotal,
      hotels: hotelTotal,
      flights: flightTotal,
      transfers: transferTotal,
      subtotal: subtotal,
      tcsRate: tcsRate,
      tcsAmount: tcsAmount,
      grandTotal: subtotal + tcsAmount
    };
  };
  
  // Main transformation function
  export const transformBookingData = (bookingItinerary, formData) => {
    if (!bookingItinerary || !formData.travelers) {
      throw new Error('Invalid booking data');
    }
  
    // Transform travelers with required type field
    const transformedTravelers = transformTravelers(formData.travelers);
  
    // Transform all bookings
    const activityBookings = transformActivityBookings(
      bookingItinerary, 
      transformedTravelers, 
      formData.specialRequirements
    );
  
    const hotelBookings = transformHotelBookings(bookingItinerary, transformedTravelers);
    const transferBookings = transformTransferBookings(bookingItinerary, transformedTravelers);
    const flightBookings = transformFlightBookings(bookingItinerary, transformedTravelers);
  
    // Calculate final prices
    const prices = calculatePrices(bookingItinerary, activityBookings);
  
    return {
      itineraryToken: bookingItinerary.itineraryToken,
      inquiryToken: bookingItinerary.inquiryToken,
      travelers: transformedTravelers,
      activityBookings,
      hotelBookings,
      transferBookings,
      flightBookings,
      prices,
      specialRequirements: formData.specialRequirements || ''
    };
  };