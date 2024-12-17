// utils/catchAsync.js
const catchAsync = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next))
        .catch((err) => {
          res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
            error: err.stack
          });
        });
    };
  };
  
  module.exports = catchAsync;