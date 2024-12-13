// A simple error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific errors (e.g., validation errors, DB errors, etc.)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: ' + err.message;
  } else if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate key error: ' + JSON.stringify(err.keyValue);
  }

  // Send the error response
  return res.status(statusCode).json({
    success: false,
    message,
    error: err.stack, // Optionally, include stack trace in development
  });
};

module.exports = errorHandler;
