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

// --- NEW: Axios Error Handler --- 
/**
 * Processes an Axios error, logs detailed information, and throws a formatted error.
 * This allows service layers to handle Axios errors consistently without sending HTTP responses.
 * @param {Error} error - The error object, expected to be from Axios.
 * @param {string} [context='API Call'] - A string describing the context of the API call.
 */
const handleAxiosError = (error, context = 'API Call') => {
  let status = error.response?.status;
  // Try to get a meaningful message from the response data or fallback to the error message
  let message = error.response?.data?.message 
             || (typeof error.response?.data === 'string' ? error.response.data : null) // Handle plain string errors
             || error.message 
             || `Failed during ${context}`;
  let details = error.response?.data || {};

  logger.error(`[${context}] Axios Error:`, {
    message: message,
    status: status,
    url: error.config?.url,
    method: error.config?.method,
    // Avoid logging potentially large/sensitive request data by default
    // requestData: error.config?.data, 
    responseData: details,
  });

  // Create a new error object with extracted details to throw upwards
  const formattedError = new Error(message);
  formattedError.status = status || 500; // Attach status for controller's handleError
  formattedError.details = details; // Attach details for controller's handleError
  formattedError.code = error.code; // Preserve original error code if available (e.g., ECONNREFUSED)

  throw formattedError; // Re-throw the formatted error to be caught by the controller
};
// --- END NEW --- 

module.exports = {
  handleError,
  handleAxiosError
};