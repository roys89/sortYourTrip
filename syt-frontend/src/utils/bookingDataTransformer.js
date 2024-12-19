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
            const bookingRef = activity.bookingReference?.bookingRef || null;
            const activityCode = activity.activityCode || null;
            
            return {
              searchId: activity.searchId || null,
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
              rateKey: activity.packageDetails?.ratekey && bookingRef
              ? `${activity.packageDetails.ratekey}|${bookingRef}`
              : null,
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
  const transformHotelBookings = (bookingItinerary, roomsData) => {
    const allHotels = bookingItinerary.cities?.flatMap(city => 
      city.days?.flatMap(day => day.hotels || [])
    ) || [];
    
    if (!allHotels.length) return [];
  
    return allHotels.map(hotel => {
      // Transform each room's travelers into paxes
      const rooms = roomsData.map(roomData => ({
        paxes: roomData.travelers.map(traveler => ({
          title: traveler.title,
          name: traveler.firstName,
          surname: traveler.lastName,
          type: parseInt(traveler.age) >= 12 ? 'AD' : 'CH',
          age: traveler.age
        })),
        room_reference: hotel.rate.rooms[0].room_reference || null,
      }));
  
      return {
        searchId: hotel.search_id || null,
        hotelCode: hotel.hotelCode,
        cityCode: hotel.cityCode || null,
        groupCode: hotel.rate?.group_code || null,
        checkin: hotel.checkIn || null,
        checkout: hotel.checkOut || null,
        bookingStatus: 'pending',
        amount: hotel.rate?.price || 0,
        holder: {
          title: roomsData[0].travelers[0].title,
          name: roomsData[0].travelers[0].firstName,
          surname: roomsData[0].travelers[0].lastName,
          email: roomsData[0].travelers[0].email,
          phone_number: roomsData[0].travelers[0].phone,
          client_nationality: roomsData[0].travelers[0].nationality?.toLowerCase() || '',
        },
        booking_comments: "Booking created via web",
        payment_type: "Pending",
        agent_reference: generateAgentReference(),
        booking_items: [{
          rate_key: hotel.rate?.rate_key || null,
          room_code: hotel.rate?.room_code || null,
          rooms: rooms
        }]
      };
    });
  };

// Transform transfer bookings  
const transformTransferBookings = (bookingItinerary, travelers) => {
  const allTransfers = bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => day.transfers || [])
  ) || [];
  
  if (!allTransfers.length) return [];

  return allTransfers.map(transfer => {
    const dayInfo = bookingItinerary.cities.find(city => 
      city.days.some(day => day.transfers?.includes(transfer))
    )?.days.find(day => day.transfers?.includes(transfer));

    return {
      quotationId: transfer.details?.quotation_id || null,
      bookingDate: dayInfo?.date || bookingItinerary.startDate, // Add required booking date
      bookingTime: transfer.details?.selectedQuote?.time || "12:00",
      returnDate: bookingItinerary.endDate,
      returnTime: transfer.details?.returnTime || "12:00",
      totalPassenger: travelers.length,
      bookingStatus: 'pending',
      amount: transfer.details?.selectedQuote?.fare || 0,
      quotationChildId: transfer.details?.quotation_child_id,
      comments: transfer.details?.comments || "Transfer booking",
      flightNumber: transfer.details?.flight_number,
      // Add transfer details
      origin: {
        address: transfer.details?.origin?.display_address,
        city: transfer.details?.origin?.city
      },
      destination: {
        address: transfer.details?.destination?.display_address,
        city: transfer.details?.destination?.city
      }
    };
  });
};

// Transform flight bookings
const transformFlightBookings = (bookingItinerary, travelers) => {
  const allFlights = bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => day.flights || [])
  ) || [];
  
  if (!allFlights.length) return [];

  // Map over allFlights instead of bookingItinerary.flights
  return allFlights.map(flight => ({
    flightCode: flight.flightData?.flightCode || `FL-${generateUniqueId()}`,
    origin: flight.flightData?.origin,
    destination: flight.flightData?.destination,
    departureDate: flight.flightData?.departureDate,
    departureTime: flight.flightData?.departureTime,
    returnFlightCode: flight.flightData?.returnFlightCode,
    returnDepartureDate: flight.flightData?.returnDepartureDate,
    returnDepartureTime: flight.flightData?.returnDepartureTime,
    bookingStatus: 'pending',
    amount: flight.flightData?.price || 0,
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
    if (!bookingItinerary || !formData.rooms) {
      throw new Error('Invalid booking data');
    }
  
    // Flatten travelers from rooms and transform them
    const allTravelers = formData.rooms.flatMap(room => room.travelers);
    const transformedTravelers = transformTravelers(allTravelers);
  
    // Transform all bookings with room-aware structure
    const activityBookings = transformActivityBookings(
      bookingItinerary, 
      transformedTravelers, 
      formData.specialRequirements
    );
  
    const hotelBookings = transformHotelBookings(bookingItinerary, formData.rooms);
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