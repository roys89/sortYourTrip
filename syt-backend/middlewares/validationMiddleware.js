// middlewares/validationMiddleware.js
const Joi = require('joi');

const validateBookingSchema = (req, res, next) => {
  const schema = Joi.object({
    itineraryToken: Joi.string().required(),
    inquiryToken: Joi.string().required(),
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
      type: Joi.string().required()
    })).min(1).required(),

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
        age: Joi.number().required()
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
      QuestionAnswers: Joi.array().required(),
      travellers: Joi.array().required(),
      amount: Joi.number().required()
    })),

    hotelBookings: Joi.array().items(Joi.object({
      searchId: Joi.string().required(),
      hotelCode: Joi.string().required(),
      cityCode: Joi.string().required(),
      groupCode: Joi.string().required(),
      checkin: Joi.string().required(),
      checkout: Joi.string().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      amount: Joi.number().required(),
      holder: Joi.object({
        title: Joi.string().required(),
        name: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().email().required(),
        phone_number: Joi.string().required(),
        client_nationality: Joi.string().required()
      }).required(),
      booking_comments: Joi.string().allow(''),
      payment_type: Joi.string().allow(''),
      agent_reference: Joi.string().allow(''),
      booking_items: Joi.array().items(Joi.object({
        rate_key: Joi.string().required(),
        room_code: Joi.string().required(),
        rooms: Joi.array().items(Joi.object({
          paxes: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            name: Joi.string().required(),
            surname: Joi.string().required(),
            type: Joi.string().required(),
            age: Joi.string().required()
          })).required(),
          room_reference: Joi.string().allow(null).required()
        })).required()
      })).required()
    })),

    transferBookings: Joi.array().items(Joi.object({
      quotationId: Joi.string().required(),
      bookingDate: Joi.string().required(),
      bookingTime: Joi.string().required(),
      returnDate: Joi.string().allow(null),
      returnTime: Joi.string().allow(null),
      totalPassenger: Joi.number().required(),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      amount: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
      comments: Joi.string().allow(''),
      quotationChildId: Joi.string().allow(null),
      flightNumber: Joi.string().allow(null),
      origin: Joi.object({
        address: Joi.string().required(),
        city: Joi.string().required()
      }).required(),
      destination: Joi.object({
        address: Joi.string().required(),
        city: Joi.string().required()
      }).required()
    })),

    flightBookings: Joi.array().items(Joi.object({
      flightCode: Joi.string().required(),
      origin: Joi.string().required(),
      destination: Joi.string().required(),
      departureDate: Joi.string().required(),
      departureTime: Joi.string().required(),
      returnFlightCode: Joi.string().allow(null),
      returnDepartureDate: Joi.string().allow(null),
      returnDepartureTime: Joi.string().allow(null),
      bookingStatus: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed').default('pending'),
      amount: Joi.number().required(),
      passengers: Joi.array().items(Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dateOfBirth: Joi.string().required(),
        passportNumber: Joi.string().required(),
        nationality: Joi.string().required(),
        type: Joi.string().required()
      })).required()
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

    specialRequirements: Joi.string().allow('').default('')
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  
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