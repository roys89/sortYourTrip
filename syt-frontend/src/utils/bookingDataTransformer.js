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
      answer: specialRequirements || "NA"
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
  return travelers.map(traveler => {
    const baseTransform = {
      title: traveler.title,
      firstName: traveler.firstName,
      lastName: traveler.lastName,
      email: traveler.email,
      phone: `${traveler.cellCountryCode}-${traveler.phone}`,
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
      type: parseInt(traveler.age) >= 12 ? 'adult' : 'child',
      gender: traveler.gender,
      addressLineOne: traveler.addressLineOne,
      addressLineTwo: traveler.addressLineTwo || '',
      city: traveler.city,
      country: traveler.country,
      countryCode: traveler.countryCode,
      panNumber: traveler.panNumber, // Added PAN number
      frequentFlyerAirlineCode: traveler.frequentFlyerAirlineCode || null,
      frequentFlyerNumber: traveler.frequentFlyerNumber || null
    };

    // Add GST details only for adults
    if (parseInt(traveler.age) >= 12 && traveler.gstNumber) {
      return {
        ...baseTransform,
        gstDetails: {
          gstNumber: traveler.gstNumber,
          companyName: traveler.gstCompanyName,
          companyAddress: traveler.gstCompanyAddress,
          companyEmail: traveler.gstCompanyEmail,
          companyContactNumber: traveler.gstCompanyContactNumber
        }
      };
    }

    return {
      ...baseTransform,
      gstDetails: null
    };
  });
};

// Transform hotel bookings
const transformHotelBookings = (bookingItinerary, roomsData) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.hotels || [])
        .filter(hotel => hotel.success && hotel.data)
        .map(hotel => {
          return {
            hotelId: hotel.data.staticContent[0].id,
            city: hotel.data.hotelDetails?.address?.city?.name,
            checkin: day.date,
            checkout: hotel.checkOut,
            bookingStatus: 'pending',
            itineraryCode: hotel.data.code,
            bookingArray: [{
              traceId: hotel.data.traceId,
              roomsAllocations: roomsData.map((room, roomIndex) => ({
                rateId: hotel.data.items[0].selectedRoomsAndRates[roomIndex]?.rate.id,
                roomId: hotel.data.items[0].selectedRoomsAndRates[roomIndex]?.room.id,
                guests: room.travelers.map(traveler => ({
                  title: traveler.title,
                  firstName: traveler.firstName,
                  lastName: traveler.lastName,
                  isLeadGuest: traveler === room.travelers[0],
                  type: parseInt(traveler.age) >= 12 ? 'adult' : 'child',
                  email: traveler.email,
                  isdCode: traveler.cellCountryCode,
                  contactNumber: traveler.phone,
                  panCardNumber: traveler.panNumber,
                  passportNumber: traveler.passportNumber,
                  passportExpiry: traveler.passportExpiryDate,
                  addressLineOne: traveler.addressLineOne,
                  addressLineTwo: traveler.addressLineTwo || '',
                  city: traveler.city,
                  countryCode: traveler.countryCode,
                  nationality: traveler.nationality,
                  gender: traveler.gender,
                  gstDetails: parseInt(traveler.age) >= 12 && traveler.gstNumber ? {
                    gstNumber: traveler.gstNumber,
                    companyName: traveler.gstCompanyName,
                    companyAddress: traveler.gstCompanyAddress,
                    companyEmail: traveler.gstCompanyEmail,
                    companyContactNumber: traveler.gstCompanyContactNumber
                  } : null
                }))
              })),
              specialRequests: null
            }]
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
          transferId: transfer.details.quotation_id,
          bookingDate: day.date,
          bookingTime: quote?.routeDetails?.pickup_date?.split(' ')[1] || "00:00",
          returnDate: quote?.routeDetails?.return_date?.split(' ')[0] || null,
          returnTime: quote?.routeDetails?.return_date?.split(' ')[1] || null,
          bookingArray: [{
            booking_date: day.date,
            booking_time: quote?.routeDetails?.pickup_date?.split(' ')[1] || "00:00",
            return_date: quote?.routeDetails?.return_date?.split(' ')[0] || null,
            return_time: quote?.routeDetails?.return_date?.split(' ')[1] || null,
            guest_details: {
              title: leadTraveler.title,
              first_name: leadTraveler.firstName,
              last_name: leadTraveler.lastName,
              email: leadTraveler.email,
              phone: `${leadTraveler.cellCountryCode}-${leadTraveler.phone}`,
              nationality: leadTraveler.nationality,
              gender: leadTraveler.gender,
              addressLineOne: leadTraveler.addressLineOne,
              addressLineTwo: leadTraveler.addressLineTwo || '',
              city: leadTraveler.city,
              country: leadTraveler.country,
              countryCode: leadTraveler.countryCode
            },
            quotation_id: transfer.details.quotation_id,
            quotation_child_id: transfer.details.selectedQuote.quote.quote_id || null,
            comments: transfer.specialRequirements || null,
            total_passenger: travelers.length,
            flight_number: transfer.details.flightNumber || null
          }]
        };
      })
    )
  ) || [];
};

// Transform flight bookings
const transformFlightBookings = (bookingItinerary, travelers) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.flights || []).map(flight => {
        const flightData = flight.flightData;
        
        const seatsBySegment = flightData.selectedSeats?.reduce((acc, segment) => {
          const segmentSeats = segment.rows.flatMap(row => 
            row.seats.map(seat => ({
              origin: segment.origin,
              destination: segment.destination,
              code: seat.code,
              amt: seat.price,
              seat: seat.seatNo
            }))
          );
          acc[`${segment.origin}-${segment.destination}`] = segmentSeats;
          return acc;
        }, {}) || {};

        const meals = flightData.selectedMeal?.flatMap(segment =>
          segment.options.map(meal => ({
            origin: segment.origin,
            destination: segment.destination,
            code: meal.code,
            amt: meal.price,
            description: meal.description
          }))
        ) || [];

        return {
          bookingArray: [{
            traceId: flightData.resultIndex,
            passengers: travelers.map((traveler, index) => {
              const assignedSeats = Object.values(seatsBySegment).map(segmentSeats => {
                const availableSeat = segmentSeats[index];
                return availableSeat;
              }).filter(Boolean);

              return {
                title: traveler.title,
                firstName: traveler.firstName,
                lastName: traveler.lastName,
                passportNumber: traveler.passportNumber,
                passportExpiry: traveler.passportExpiryDate,
                gender: traveler.gender,
                isLeadPax: index === 0,
                paxType: parseInt(traveler.age) >= 12 ? 1 : 2,
                addressLineOne: traveler.addressLineOne,
                addressLineTwo: traveler.addressLineTwo || '',
                city: traveler.city,
                cellCountryCode: traveler.cellCountryCode,
                contactNumber: traveler.phone,
                countryCode: traveler.countryCode,
                countryName: traveler.country,
                dateOfBirth: traveler.dateOfBirth,
                email: traveler.email,
                frequentFlyerAirlineCode: traveler.frequentFlyerAirlineCode || null,
                frequentFlyerNumber: traveler.frequentFlyerNumber || null,
                nationality: traveler.nationality,
                ...(flightData.isSeatSelected || flightData.isMealSelected || flightData.isBaggageSelected) && {
                  ssr: {
                    meal: flightData.isMealSelected ? meals : [],
                    baggage: flightData.isBaggageSelected ? [] : [],
                    seat: flightData.isSeatSelected ? assignedSeats : []
                  }
                },
                ...(parseInt(traveler.age) >= 12 && traveler.gstNumber) && {
                  gstCompanyAddress: traveler.gstCompanyAddress,
                  gstCompanyContactNumber: traveler.gstCompanyContactNumber,
                  gstCompanyEmail: traveler.gstCompanyEmail,
                  gstCompanyName: traveler.gstCompanyName,
                  gstNumber: traveler.gstNumber
                }
              };
            })
          }],
          itineraryCode: flightData.bookingDetails?.itineraryCode,
          flightCode: flightData.flightCode,
          bookingStatus: 'pending',
          departureTime: flightData.departureTime,
          departureDate: flightData.departureDate,
          destination: flightData.destination,
          origin: flightData.origin,
          landingTime: flightData.landingTime,
          arrivalTime: flightData.arrivalTime,
          airline: flightData.airline,
          resultIndex: flightData.resultIndex,
          flightDuration: flightData.flightDuration,
          traceId: flightData.traceId || flightData.resultIndex
        };
      })
    )
  ) || [];
};



// Helper function to determine age band
const determineAgeBand = (age, ageBands) => {
  const ageNum = parseInt(age);
  for (const band of ageBands) {
    if (ageNum >= band.startAge && ageNum <= band.endAge) {
      return band.ageBand;
    }
  }
  return 'ADULT'; // Default fallback
};

// Helper function to generate group count string
const generateGroupCountString = (travelers, ageBands) => {
  const counts = {
    ADULT: 0,
    CHILD: 0,
    INFANT: 0,
    SENIOR: 0,
    YOUTH: 0
  };

  travelers.forEach(traveler => {
    const band = determineAgeBand(traveler.age, ageBands);
    counts[band]++;
  });

  return `${counts.ADULT}&${counts.CHILD}&${counts.INFANT}&${counts.SENIOR}&${counts.YOUTH}`;
};

const transformActivityBookings = (bookingItinerary, travelers, specialRequirements) => {
  return bookingItinerary.cities?.flatMap(city => 
    city.days?.flatMap(day => 
      (day.activities || [])
        .filter(activity => activity.activityType === 'online')
        .map(activity => {
          // Generate group count string based on age bands
          const groupCountStr = generateGroupCountString(travelers, activity.ageBands);
          
          // Construct rateKey with bookingRef
          const rateKey = activity.packageDetails?.ratekey 
            ? `${activity.packageDetails.ratekey}|${activity.bookingReference?.bookingRef || ''}`
            : null;

          // Construct groupCode with counts
          const baseGroupCode = activity.groupCode || '';
          const groupCode = `${baseGroupCode}-${groupCountStr}`;

          return {
            searchId: activity.searchId,
            bookingRef: activity.bookingReference?.bookingRef || null,
            activityCode: activity.activityCode,
            bookingStatus: 'pending',
            lead: {
              title: travelers[0].title,
              name: travelers[0].firstName,
              surname: travelers[0].lastName,
              clientNationality: travelers[0].nationality,
              age: parseInt(travelers[0].age),
              gender: travelers[0].gender,
              email: travelers[0].email,
              phone: travelers[0].phone,
              addressLineOne: travelers[0].addressLineOne,
              addressLineTwo: travelers[0].addressLineTwo || '',
              city: travelers[0].city,
              country: travelers[0].country,
              countryCode: travelers[0].countryCode
            },
            agentRef: generateAgentReference(),
            rateKey: rateKey,
            fromDate: day.date,
            toDate: day.date,
            groupCode: groupCode,
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
              type: determineAgeBand(traveler.age, activity.ageBands).toLowerCase(),
              age: traveler.age,
              gender: traveler.gender,
              nationality: traveler.nationality,
              email: traveler.email,
              phone: traveler.phone,
              addressLineOne: traveler.addressLineOne,
              addressLineTwo: traveler.addressLineTwo || '',
              city: traveler.city,
              country: traveler.country,
              countryCode: traveler.countryCode
            }))
          };
        })
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

    // Generate unique booking ID
    const bookingId = `BK-${generateUniqueId()}-${Date.now()}`;

    return {
      bookingId,
      itineraryToken: bookingItinerary.itineraryToken,
      inquiryToken: bookingItinerary.inquiryToken,
      status: 'pending',
      bookingDate: new Date().toISOString(),

      // Transformed travelers
      travelers: transformedTravelers,

      // Bookings
      hotelBookings: transformHotelBookings(bookingItinerary, formData.rooms),
      transferBookings: transformTransferBookings(bookingItinerary, transformedTravelers),
      activityBookings: transformActivityBookings(bookingItinerary, transformedTravelers, formData.specialRequirements),
      flightBookings: transformFlightBookings(bookingItinerary, transformedTravelers),

      // Price information
      prices: calculatePrices(bookingItinerary),

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