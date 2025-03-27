const Joi = require('joi');

const validateBooking = (req, res, next) => {
  const userInfoSchema = Joi.object({
    userId: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required()
  });
  
  const travelerSchema = Joi.object({
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
    cellCountryCode: Joi.string().required(),
    countryCode: Joi.string().required(),
    panNumber: Joi.string().required(),
    frequentFlyerAirlineCode: Joi.string().allow(null),
    frequentFlyerNumber: Joi.string().allow(null),
    gstNumber: Joi.string().allow(null),
    gstCompanyName: Joi.string().allow(null),
    gstCompanyAddress: Joi.string().allow(null),
    gstCompanyEmail: Joi.string().allow(null),
    gstCompanyContactNumber: Joi.string().allow(null)
  });

  const roomSchema = Joi.object({
    roomNumber: Joi.number().required(),
    travelers: Joi.array().items(travelerSchema).min(1).required()
  });

  const bookingSchema = Joi.object({
    bookingId: Joi.string().required(),
    itineraryToken: Joi.string().required(),
    inquiryToken: Joi.string().required(),
    userInfo: userInfoSchema.required(),
    rooms: Joi.array().items(roomSchema).min(1).required(),
    specialRequirements: Joi.string().allow('', null),
    // Add payment-related validations
    totalAmount: Joi.number().positive().required(),
    tcsAmount: Joi.number().min(0).required(),
    tcsRate: Joi.number().min(0).required(),
    paymentStatus: Joi.string()
      .valid('pending', 'processing', 'completed', 'failed')
      .default('pending'),
    // Add Razorpay-related fields as optional since they'll be updated later
    razorpay: Joi.object({
      orderId: Joi.string().allow(null),
      paymentId: Joi.string().allow(null),
      signature: Joi.string().allow(null)
    }).allow(null)
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
  validateBooking
};