// utils/bookingDataTransformer.js

// Utility functions
export const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateAgentReference = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

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

// Generate question answers for activities
const generateQuestionAnswers = (travelers, specialRequirements = '') => {
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

  if (specialRequirements) {
    answers.push({
      question: "SPECIAL_REQUIREMENTS",
      answer: specialRequirements
    });
  }

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
    type: parseInt(traveler.age) >= 12 ? 'adult' : 'child'
  }));
};

// Transform activity bookings
const transformActivityBookings = (bookingItinerary, travelers, specialRequirements) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.activities || [])
        .filter(activity => activity.activityType === 'online')
        .map(activity => ({
          searchId: activity.searchId,
          bookingRef: activity.bookingReference?.bookingRef || null,
          activityCode: activity.activityCode,
          bookingStatus: 'pending',
          lead: {
            title: travelers[0].title,
            name: travelers[0].firstName,
            surname: travelers[0].lastName,
            clientNationality: travelers[0].nationality,
            age: parseInt(travelers[0].age)
          },
          agentRef: generateAgentReference(),
          rateKey: activity.packageDetails?.ratekey || null,
          fromDate: day.date,
          toDate: day.date,
          groupCode: activity.groupCode,
          hotelId: null,
          languageGuide: activity.tourGrade?.langServices?.[0] || {
            type: "GUIDE",
            language: "en",
            legacyGuide: "en/SERVICE_GUIDE"
          },
          QuestionAnswers: generateQuestionAnswers(travelers, specialRequirements),
          travellers: travelers.map(traveler => ({
            title: traveler.title,
            name: traveler.firstName,
            surname: traveler.lastName,
            type: parseInt(traveler.age) >= 12 ? 'adult' : 'child',
            age: traveler.age
          })),
          amount: activity.packageDetails?.amount || 0,
          packageDetails: {
            title: activity.packageDetails?.title,
            description: activity.packageDetails?.description,
            departureTime: activity.packageDetails?.departureTime,
            duration: activity.duration,
            inclusions: activity.inclusions?.map(inc => inc.otherDescription || inc.typeDescription),
            exclusions: activity.exclusions?.map(exc => exc.otherDescription || exc.typeDescription)
          },
          cancellationPolicies: activity.cancellationFromTourDate
        }))
    )
  ) || [];
};

// Transform hotel bookings
const transformHotelBookings = (bookingItinerary, roomsData) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.hotels || [])
        .filter(hotel => hotel.success && hotel.data)
        .map(hotel => {
          const firstTraveler = roomsData[0].travelers[0]; // Lead guest

          return {
            hotelId: hotel.data.staticContent[0].id,
            traceId: hotel.data.traceId,
            roomsAllocations: roomsData.map((room, roomIndex) => ({
              rateId: hotel.data.items[0].selectedRoomsAndRates[roomIndex]?.rate.id,
              roomId: hotel.data.items[0].selectedRoomsAndRates[roomIndex]?.room.id,
              guests: room.travelers.map(traveler => ({
                title: traveler.title,
                firstName: traveler.firstName,
                lastName: traveler.lastName,
                isLeadGuest: traveler === firstTraveler,
                type: parseInt(traveler.age) >= 12 ? 'adult' : 'child',
                email: traveler.email,
                isdCode: traveler.phone.split('-')[0] || '91',
                contactNumber: traveler.phone.split('-')[1] || traveler.phone,
                panCardNumber: null,
                passportNumber: traveler.passportNumber,
                passportExpiry: traveler.passportExpiryDate
              }))
            })),
            specialRequests: null,
            itineraryCode: hotel.data.code,
            totalAmount: hotel.data.totalAmount,
            cityCode: hotel.data.hotelDetails?.address?.city?.name,
            checkin: day.date,
            checkout: hotel.checkOut,
            bookingStatus: 'pending',
            cancellationPolicies: hotel.data.items[0]?.selectedRoomsAndRates[0]?.rate.cancellationPolicies,
            boardBasis: hotel.data.items[0]?.selectedRoomsAndRates[0]?.rate.boardBasis,
            hotelDetails: {
              name: hotel.data.hotelDetails?.name,
              category: hotel.data.hotelDetails?.starRating,
              address: {
                line1: hotel.data.hotelDetails?.address?.line1,
                city: hotel.data.hotelDetails?.address?.city?.name,
                country: hotel.data.hotelDetails?.address?.country?.name
              },
              geolocation: {
                lat: hotel.data.hotelDetails?.geolocation?.lat,
                long: hotel.data.hotelDetails?.geolocation?.long
              }
            },
            includes: hotel.data.items[0]?.selectedRoomsAndRates[0]?.rate.includes || [],
            additionalCharges: hotel.data.items[0]?.selectedRoomsAndRates[0]?.rate.additionalCharges?.map(charge => ({
              type: charge.charge?.type,
              description: charge.charge?.description,
              amount: charge.charge?.amount
            })) || []
          };
        })
    )
  ) || [];
};

// Transform transfer bookings
const transformTransferBookings = (bookingItinerary, travelers) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.transfers || []).map(transfer => {
        const leadTraveler = travelers[0];
        const quote = transfer.details?.selectedQuote;
        
        return {
          type: transfer.type,
          booking_date: day.date,
          booking_time: quote?.routeDetails?.pickup_date?.split(' ')[1] || "00:00",
          return_date: quote?.routeDetails?.return_date?.split(' ')[0] || null,
          return_time: quote?.routeDetails?.return_date?.split(' ')[1] || null,
          guest_details: {
            first_name: leadTraveler.firstName,
            last_name: leadTraveler.lastName,
            email: leadTraveler.email,
            phone: leadTraveler.phone
          },
          quotation_id: transfer.details.quotation_id,
          quotation_child_id: transfer.details.quotation_child_id || null,
          comments: transfer.details.comments || null,
          total_passenger: travelers.length,
          flight_number: transfer.details.flightNumber || null,
          bookingStatus: 'pending',
          amount: quote?.quote?.fare || 0,
          vehicleDetails: {
            class: quote?.quote?.vehicle?.ve_class,
            capacity: quote?.quote?.vehicle?.ve_max_capacity,
            type: quote?.quote?.vehicle?.ve_similar_types,
            luggage_capacity: quote?.quote?.vehicle?.ve_luggage_capacity,
            tags: quote?.quote?.vehicle?.ve_tags,
            vehicle_image: quote?.quote?.vehicle?.vehicleImages?.ve_im_url
          },
          routeDetails: {
            distance: transfer.details.distance,
            duration: transfer.details.duration,
            pickup_location: {
              address: transfer.details.origin.display_address,
              coordinates: {
                lat: parseFloat(transfer.details.origin.lat),
                long: parseFloat(transfer.details.origin.long)
              }
            },
            dropoff_location: {
              address: transfer.details.destination.display_address,
              coordinates: {
                lat: parseFloat(transfer.details.destination.lat),
                long: parseFloat(transfer.details.destination.long)
              }
            }
          },
          fareDetails: {
            baseFare: quote?.quote?.fare || 0,
            taxes: 0,
            fees: 0
          }
        };
      })
    )
  ) || [];
};

// Transform flight bookings
const transformFlightBookings = (bookingItinerary, travelers) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.flights || []).map(flight => ({
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
        })),
        fareDetails: {
          baseFare: flight.flightData?.fareDetails?.baseFare || 0,
          taxAndSurcharge: flight.flightData?.fareDetails?.taxAndSurcharge || 0,
          serviceFee: flight.flightData?.fareDetails?.serviceFee || 0,
          isRefundable: flight.flightData?.fareDetails?.isRefundable || false
        },
        baggage: {
          checkedBaggage: flight.flightData?.segments?.[0]?.baggage || '',
          cabinBaggage: flight.flightData?.segments?.[0]?.cabinBaggage || ''
        },
        segmentDetails: flight.flightData?.segments?.map(segment => ({
          flightNumber: segment.flightNumber,
          airline: {
            code: segment.airline?.code,
            name: segment.airline?.name
          },
          departureTime: segment.departureTime,
          arrivalTime: segment.arrivalTime,
          duration: segment.duration
        })) || []
      }))
    )
  ) || [];
};

// Calculate prices with safeguards
const calculatePrices = (bookingItinerary) => {
  if (!bookingItinerary?.priceTotals) {
    return {
      activities: 0,
      hotels: 0,
      flights: 0,
      transfers: 0,
      subtotal: 0,
      tcsRate: 0,
      tcsAmount: 0,
      grandTotal: 0
    };
  }

  const {
    activities = 0,
    hotels = 0,
    flights = 0,
    transfers = 0,
    subtotal = 0,
    tcsRate = 0,
    tcsAmount = 0,
    grandTotal = 0
  } = bookingItinerary.priceTotals;

  return {
    activities: Number(activities),
    hotels: Number(hotels),
    flights: Number(flights),
    transfers: Number(transfers),
    subtotal: Number(subtotal),
    tcsRate: Number(tcsRate),
    tcsAmount: Number(tcsAmount),
    grandTotal: Number(grandTotal)
  };
};

// Main transformation function
export const transformBookingData = (bookingItinerary, formData) => {
  if (!bookingItinerary || !formData.rooms) {
    throw new Error('Invalid booking data');
  }

  try {
    const allTravelers = formData.rooms.flatMap(room => room.travelers);
    const transformedTravelers = transformTravelers(allTravelers);

    const hotelBookings = transformHotelBookings(bookingItinerary, formData.rooms);
    const transferBookings = transformTransferBookings(bookingItinerary, transformedTravelers);
    const activityBookings = transformActivityBookings(bookingItinerary, transformedTravelers, formData.specialRequirements);
    const flightBookings = transformFlightBookings(bookingItinerary, transformedTravelers);

    // Basic booking info
    return {
      itineraryToken: bookingItinerary.itineraryToken,
      inquiryToken: bookingItinerary.inquiryToken,
      status: 'pending',
      bookingDate: new Date().toISOString(),

      // Transformed travelers
      travelers: transformedTravelers.map(traveler => ({
        title: traveler.title,
        firstName: traveler.firstName,
        lastName: traveler.lastName,
        email: traveler.email,
        phone: traveler.phone,
        dateOfBirth: traveler.dateOfBirth,
        age: traveler.age,
        passportNumber: traveler.passportNumber,
        passportIssueDate: traveler.passportIssueDate,
        passportExpiryDate: traveler.passportExpiryDate,
        nationality: traveler.nationality,
        weight: traveler.weight,
        height: traveler.height,
        preferredLanguage: traveler.preferredLanguage,
        foodPreference: traveler.foodPreference,
        type: traveler.type
      })),

      // Bookings
      hotelBookings: hotelBookings.map(hotel => ({
        ...hotel,
        bookingStatus: 'pending'
      })),

      transferBookings: transferBookings.map(transfer => ({
        ...transfer,
        bookingStatus: 'pending'
      })),

      activityBookings: activityBookings.map(activity => ({
        ...activity,
        bookingStatus: 'pending'
      })),

      flightBookings: flightBookings.map(flight => ({
        ...flight,
        bookingStatus: 'pending'
      })),

      // Price information
      prices: {
        activities: Number(bookingItinerary.priceTotals?.activities || 0),
        hotels: Number(bookingItinerary.priceTotals?.hotels || 0),
        flights: Number(bookingItinerary.priceTotals?.flights || 0),
        transfers: Number(bookingItinerary.priceTotals?.transfers || 0),
        subtotal: Number(bookingItinerary.priceTotals?.subtotal || 0),
        tcsRate: Number(bookingItinerary.priceTotals?.tcsRate || 0),
        tcsAmount: Number(bookingItinerary.priceTotals?.tcsAmount || 0),
        grandTotal: Number(bookingItinerary.priceTotals?.grandTotal || 0)
      },

      // Additional information
      specialRequirements: formData.specialRequirements || '',
      
      // Traveler room info from itinerary
      travelersDetails: {
        type: bookingItinerary.travelersDetails?.type || 'family',
        rooms: formData.rooms.map(room => ({
          adults: room.travelers
            .filter(t => parseInt(t.age) >= 12)
            .map(t => t.age),
          children: room.travelers
            .filter(t => parseInt(t.age) < 12)
            .map(t => t.age)
        }))
      },
      userInfo: {
        userId: bookingItinerary.userInfo?.userId || null,
        firstName: bookingItinerary.userInfo?.firstName || null,
        lastName: bookingItinerary.userInfo?.lastName || null,
        email: bookingItinerary.userInfo?.email || null,
        phoneNumber: bookingItinerary.userInfo?.phoneNumber || null
      }

    };
  } catch (error) {
    console.error('Error transforming booking data:', error);
    throw new Error(`Failed to transform booking data: ${error.message}`);
  }
};

// Export all necessary functions
export {
  calculatePrices
};

// Default export
export default transformBookingData;