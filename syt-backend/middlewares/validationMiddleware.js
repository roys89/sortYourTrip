const Joi = require('joi');

const validateBookingRequest = (req, res, next) => {
  const bookingSchema = Joi.object({
    bookingId: Joi.string().required(),
    itineraryToken: Joi.string().required(),
    inquiryToken: Joi.string().required(),
    status: Joi.string().valid('pending', 'processing', 'confirmed', 'cancelled', 'failed').default('pending'),
    bookingDate: Joi.date().iso().required(),
    travelers: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      dateOfBirth: Joi.string().required(),
      age: Joi.string().required(),
      passportNumber: Joi.string().required(),
      passportIssueDate: Joi.string().required(),
      passportExpiryDate: Joi.string().required(),
      nationality: Joi.string().required(),
      weight: Joi.string().required(),
      height: Joi.string().required(),
      preferredLanguage: Joi.string().required(),
      foodPreference: Joi.string().required(),
      type: Joi.string().valid('adult', 'child').required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      addressLineOne: Joi.string().required(),
      addressLineTwo: Joi.string().allow('', null),
      city: Joi.string().required(),
      country: Joi.string().required(),
      countryCode: Joi.string().required(),
      panNumber: Joi.string().required(),
      frequentFlyerAirlineCode: Joi.string().allow(null),
      frequentFlyerNumber: Joi.string().allow(null),
      gstDetails: Joi.object({
        gstNumber: Joi.string().required(),
        companyName: Joi.string().required(),
        companyAddress: Joi.string().required(),
        companyEmail: Joi.string().email().required(),
        companyContactNumber: Joi.string().required()
      }).allow(null)
    })).required(),

    hotelBookings: Joi.array().items(Joi.object({
      hotelId: Joi.string().required(),
      city: Joi.string().required(),
      checkin: Joi.string().required(),
      checkout: Joi.string().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      itineraryCode: Joi.string().required(),
      bookingArray: Joi.array().items(Joi.object({
        traceId: Joi.string().required(),
        roomsAllocations: Joi.array().items(Joi.object({
          rateId: Joi.string().required(),
          roomId: Joi.string().required(),
          guests: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            isLeadGuest: Joi.boolean().required(),
            type: Joi.string().valid('adult', 'child').required(),
            email: Joi.string().email().required(),
            isdCode: Joi.string().required(),
            contactNumber: Joi.string().required(),
            panCardNumber: Joi.string().required(),
            passportNumber: Joi.string().required(),
            passportExpiry: Joi.string().required(),
            addressLineOne: Joi.string().required(),
            addressLineTwo: Joi.string().allow('', null),
            city: Joi.string().required(),
            countryCode: Joi.string().required(),
            nationality: Joi.string().required(),
            gender: Joi.string().valid('male', 'female', 'other').required(),
            gstDetails: Joi.object({
              gstNumber: Joi.string().required(),
              companyName: Joi.string().required(),
              companyAddress: Joi.string().required(),
              companyEmail: Joi.string().email().required(),
              companyContactNumber: Joi.string().required()
            }).allow(null)
          })).min(1).required()
        })).required(),
        specialRequests: Joi.string().allow(null)
      })).required()
    })),

    transferBookings: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      transferId: Joi.string().required(),
      bookingDate: Joi.string().required(),
      bookingTime: Joi.string().required(),
      returnDate: Joi.string().allow(null),
      returnTime: Joi.string().allow(null),
      bookingArray: Joi.array().items(Joi.object({
        booking_date: Joi.string().required(),
        booking_time: Joi.string().required(),
        return_date: Joi.string().allow(null),
        return_time: Joi.string().allow(null),
        guest_details: Joi.object({
          title: Joi.string().required(),
          first_name: Joi.string().required(),
          last_name: Joi.string().required(),
          email: Joi.string().email().required(),
          phone: Joi.string().required(),
          nationality: Joi.string().required(),
          gender: Joi.string().valid('male', 'female', 'other').required(),
          addressLineOne: Joi.string().required(),
          addressLineTwo: Joi.string().allow('', null),
          city: Joi.string().required(),
          country: Joi.string().required(),
          countryCode: Joi.string().required()
        }).required(),
        quotation_id: Joi.string().required(),
        quotation_child_id: Joi.number().allow(null),
        comments: Joi.string().allow(null),
        total_passenger: Joi.number().required(),
        flight_number: Joi.string().allow(null)
      })).required()
    })),

    activityBookings: Joi.array().items(Joi.object({
      searchId: Joi.string().required(),
      bookingRef: Joi.string().required(),
      activityCode: Joi.string().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      lead: Joi.object({
        title: Joi.string().required(),
        name: Joi.string().required(),
        surname: Joi.string().required(),
        clientNationality: Joi.string().required(),
        age: Joi.number().required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        addressLineOne: Joi.string().required(),
        addressLineTwo: Joi.string().allow('', null),
        city: Joi.string().required(),
        country: Joi.string().required(),
        countryCode: Joi.string().required()
      }).required(),
      agentRef: Joi.string().required(),
      rateKey: Joi.string().required(),
      fromDate: Joi.string().required(),
      toDate: Joi.string().required(),
      groupCode: Joi.string().required(),
      hotelId: Joi.string().allow(null),
      languageGuide: Joi.object({
        type: Joi.string().required(),
        language: Joi.string().required(),
        legacyGuide: Joi.string().required()
      }).required(),
      QuestionAnswers: Joi.array().items(Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
        unit: Joi.string().optional(),
        travelerNum: Joi.string().optional()
      })).required(),
      travellers: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        name: Joi.string().required(),
        surname: Joi.string().required(),
        type: Joi.string().valid('adult', 'child', 'youth').required(),
        age: Joi.string().required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        nationality: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        addressLineOne: Joi.string().required(),
        addressLineTwo: Joi.string().allow('', null),
        city: Joi.string().required(),
        country: Joi.string().required(),
        countryCode: Joi.string().required()
      })).required()
    })),

    flightBookings: Joi.array().items(Joi.object({
      bookingArray: Joi.array().items(Joi.object({
        traceId: Joi.string().required(),
        passengers: Joi.array().items(Joi.object({
          title: Joi.string().required(),
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          passportNumber: Joi.string().required(),
          passportExpiry: Joi.string().required(),
          gender: Joi.string().valid('male', 'female', 'other').required(),
          isLeadPax: Joi.boolean().required(),
          paxType: Joi.number().valid(1, 2).required(),
          addressLineOne: Joi.string().required(),
          addressLineTwo: Joi.string().allow('', null),
          city: Joi.string().required(),
          contactNumber: Joi.string().required(),
          countryCode: Joi.string().required(),
          countryName: Joi.string().required(),
          dateOfBirth: Joi.string().required(),
          email: Joi.string().email().required(),
          frequentFlyerAirlineCode: Joi.string().allow(null),
          frequentFlyerNumber: Joi.string().allow(null),
          nationality: Joi.string().required(),
          ssr: Joi.object({
            meal: Joi.array().items(Joi.object({
              origin: Joi.string().required(),
              destination: Joi.string().required(),
              code: Joi.string().required(),
              amt: Joi.number().required(),
              description: Joi.string().required()
            })).optional(),
            baggage: Joi.array().items(Joi.object({
              origin: Joi.string().required(),
              destination: Joi.string().required(),
              code: Joi.string().required(),
              amt: Joi.number().required(),
              description: Joi.string().required()
            })).optional(),
            seat: Joi.array().items(Joi.object({
              origin: Joi.string().required(),
              destination: Joi.string().required(),
              code: Joi.string().required(),
              amt: Joi.number().required(),
              seat: Joi.string().required()
            })).optional()
          }).optional()
        })).required()
      })).required(),
      itineraryCode: Joi.string().required(),
      flightCode: Joi.string().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      departureTime: Joi.string().required(),
      departureDate: Joi.string().required(),
      destination: Joi.string().required(),
      origin: Joi.string().required(),
      landingTime: Joi.string().required(),
      arrivalTime: Joi.string().required(),
      airline: Joi.string().required(),
      resultIndex: Joi.string().required(),
      flightDuration: Joi.string().required(),
      traceId: Joi.string().required()
    })),

    prices: Joi.object({
      activities: Joi.number().required(),
      hotels: Joi.number().required(),
      flights: Joi.number().required(),
      transfers: Joi.number().required(),
      subtotal: Joi.number().required(),
      tcsRate: Joi.number().required(),
      tcsAmount: Joi.number().required(),
      grandTotal: Joi.number().required()
    }).required(),

    specialRequirements: Joi.string().allow('', null),

    travelersDetails: Joi.object({
      type: Joi.string().default('family'),
      rooms: Joi.array().items(Joi.object({
        adults: Joi.array().items(Joi.string()),
        children: Joi.array().items(Joi.string())
      })).required()
    }).required(),

    userInfo: Joi.object({
      userId: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      phoneNumber: Joi.string().required()
    }).required()
  });

  const { error } = bookingSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

module.exports = {
  validateBookingRequest
};