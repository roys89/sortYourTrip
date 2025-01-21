const Joi = require('joi');

const validateBookingSchema = (req, res, next) => {
  const schema = Joi.object({
    bookingId: Joi.string().required(), 
    itineraryToken: Joi.string().required(),
    inquiryToken: Joi.string().required(),
    status: Joi.string().valid('pending', 'processing', 'confirmed', 'cancelled', 'failed').default('pending'),
    bookingDate: Joi.date().iso().required(),

    userInfo: Joi.object({
      userId: Joi.string().allow(null),
      firstName: Joi.string().allow(null),
      lastName: Joi.string().allow(null),
      email: Joi.string().email().allow(null),
      phoneNumber: Joi.string().allow(null)
    }).optional(),

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
      type: Joi.string().valid('adult', 'child').required()
    })).min(1).required(),

    hotelBookings: Joi.array().items(Joi.object({
      hotelId: Joi.string().required(),
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
          panCardNumber: Joi.string().allow(null),
          passportNumber: Joi.string().required(),
          passportExpiry: Joi.string().required()
        })).min(1).required()
      })).min(1).required(),
      
      specialRequests: Joi.string().allow(null, ''),
      itineraryCode: Joi.string().required(),
      totalAmount: Joi.number().required(),
      cityCode: Joi.string().required(),
      checkin: Joi.string().required(),
      checkout: Joi.string().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      
      cancellationPolicies: Joi.array().items(Joi.object({
        text: Joi.string().optional(),
        rules: Joi.array().items(Joi.object({
          value: Joi.alternatives().try(Joi.number(), Joi.string()),
          valueType: Joi.string(),
          estimatedValue: Joi.alternatives().try(Joi.number(), Joi.string()),
          start: Joi.string(),
          end: Joi.string()
        })).optional()
      })).optional(),
      
      boardBasis: Joi.object({
        description: Joi.string().allow('', null).optional(),
        type: Joi.string().optional()
      }).optional(),
      
      includes: Joi.array().items(Joi.string().allow(null)).optional(),
      
      additionalCharges: Joi.array().items(Joi.object({
        type: Joi.string().allow(null, ''),
        description: Joi.string().allow(null, ''),
        amount: Joi.number().allow(null)
      })).optional(),
      
      hotelDetails: Joi.object({
        name: Joi.string().required(),
        category: Joi.string().required(),
        address: Joi.object({
          line1: Joi.string().required(),
          city: Joi.string().required(),
          country: Joi.string().required()
        }).required(),
        geolocation: Joi.object({
          lat: Joi.string().required(),
          long: Joi.string().required()
        }).optional()
      }).optional()
    })).optional(),

    transferBookings: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      booking_date: Joi.string().required(),
      booking_time: Joi.string().required(),
      return_date: Joi.string().allow(null, ''),
      return_time: Joi.string().allow(null, ''),
      guest_details: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required()
      }).required(),
      quotation_id: Joi.string().required(),
      quotation_child_id: Joi.string().allow(null, ''),
      comments: Joi.string().allow(null, ''),
      total_passenger: Joi.number().required(),
      flight_number: Joi.string().allow(null, ''),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      amount: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
      
      vehicleDetails: Joi.object({
        class: Joi.string().required(),
        capacity: Joi.string().required(),
        type: Joi.string().required(),
        luggage_capacity: Joi.string().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        vehicle_image: Joi.string().optional()
      }).optional(),
      
      routeDetails: Joi.object({
        distance: Joi.string().required(),
        duration: Joi.number().required(),
        pickup_location: Joi.object({
          address: Joi.string().required(),
          coordinates: Joi.object({
            lat: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
            long: Joi.alternatives().try(Joi.number(), Joi.string()).required()
          }).required()
        }).required(),
        dropoff_location: Joi.object({
          address: Joi.string().required(),
          coordinates: Joi.object({
            lat: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
            long: Joi.alternatives().try(Joi.number(), Joi.string()).required()
          }).required()
        }).required()
      }).required(),
      
      fareDetails: Joi.object({
        baseFare: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.allow(null)),
        taxes: Joi.number().allow(null),
        fees: Joi.number().allow(null)
      }).optional()
    })).optional(),

    activityBookings: Joi.array().items(Joi.object({
      searchId: Joi.string().required(),
      bookingRef: Joi.string().allow(null, ''),
      activityCode: Joi.string().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      lead: Joi.object({
        title: Joi.string().required(),
        name: Joi.string().required(),
        surname: Joi.string().required(),
        clientNationality: Joi.string().required(),
        age: Joi.number().required()
      }).required(),
      agentRef: Joi.string().required(),
      rateKey: Joi.string().allow(null, ''),
      fromDate: Joi.string().required(),
      toDate: Joi.string().required(),
      groupCode: Joi.string().required(),
      hotelId: Joi.string().allow(null, ''),
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
        type: Joi.string().valid('adult', 'child').required(),
        age: Joi.string().required()
      })).required(),
      amount: Joi.number().required(),
      
      packageDetails: Joi.object({
        title: Joi.string().allow('', null).optional(),
        description: Joi.string().allow('', null).optional(),
        departureTime: Joi.alternatives().try(
          Joi.string(), 
          Joi.number().allow(null),
          Joi.allow(null)
        ).optional(),
        duration: Joi.number().optional(),
        inclusions: Joi.array().items(Joi.string().allow(null)).optional(),
        exclusions: Joi.array().items(Joi.string().allow(null)).optional()
      }).optional(),
      
      cancellationPolicies: Joi.array().items(Joi.object({
        dayRangeMin: Joi.number(),
        dayRangeMax: Joi.number().allow(null),
        percentageRefundable: Joi.number()
      })).optional()
    })).optional(),

    flightBookings: Joi.array().items(Joi.object({
      flightCode: Joi.string().required(),
      origin: Joi.string().required(),
      destination: Joi.string().required(),
      departureDate: Joi.string().required(),
      departureTime: Joi.string().required(),
      returnFlightCode: Joi.string().allow(null, ''),
      returnDepartureDate: Joi.string().allow(null, ''),
      returnDepartureTime: Joi.string().allow(null, ''),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      amount: Joi.number().required(),
      passengers: Joi.array().items(Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dateOfBirth: Joi.string().required(),
        passportNumber: Joi.string().required(),
        nationality: Joi.string().required(),
        type: Joi.string().valid('ADULT', 'CHILD').required()
      })).min(1).required(),
      
      fareDetails: Joi.object({
        baseFare: Joi.number().optional(),
        taxAndSurcharge: Joi.number().optional(),
        serviceFee: Joi.number().optional(),
        isRefundable: Joi.boolean().optional()
      }).optional(),
      
      baggage: Joi.object({
        checkedBaggage: Joi.string().allow('').optional(),
        cabinBaggage: Joi.string().allow('').optional()
      }).optional(),
      
      segmentDetails: Joi.array().items(Joi.object({
        flightNumber: Joi.string().optional(),
        airline: Joi.object({
          code: Joi.string().optional(),
          name: Joi.string().optional()
        }).optional(),
        departureTime: Joi.string().optional(),
        arrivalTime: Joi.string().optional(),
        duration: Joi.number().optional()
      })).optional()
    })).optional(),

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

    travelersDetails: Joi.object({
      type: Joi.string().default('family'),
      rooms: Joi.array().items(Joi.object({
        adults: Joi.array().items(Joi.string()).optional(),
        children: Joi.array().items(Joi.string()).optional()
      })).required()
    }).optional(),

    specialRequirements: Joi.string().allow('').optional()
  });

  const { error } = schema.validate(req.body, { 
    abortEarly: false,
    allowUnknown: true 
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

module.exports = {
  validateBookingSchema
};