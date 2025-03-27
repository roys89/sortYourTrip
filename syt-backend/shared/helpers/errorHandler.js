const logger = require('../utils/logger');

const handleError = (res, error) => {
  // Log the error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    details: error.details || error.response?.data
  });

  // Determine status code
  const statusCode = error.status || error.response?.status || 500;

  // Prepare error response
  const errorResponse = {
    success: false,
    message: error.message || 'Internal server error',
    error: {
      code: error.code || 'INTERNAL_ERROR',
      details: error.details || error.response?.data || {}
    }
  };

  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  handleError
};