const FlightPassengerService = require('../../services/flightServices/flightPassengerService');
const HotelRoomService = require('../../services/hotelServices/hotelRoomService');
const FlightTokenManager = require('../../services/tokenManagers/flightTokenManager');
const HotelTokenManager = require('../../services/tokenManagers/hotelTokenManager');
const FlightAuthService = require('../../services/flightServices/flightAuthService');
const HotelAuthService = require('../../services/hotelServices/hotelAuthService');

class GuestAllocationController {
  static async allocateFlightPassengers(req, res) {
    try {
      const { flightData } = req.body;
      const { itineraryCode } = flightData[0];
      const bookingData = flightData[0].bookingArray;

      const flightAuthToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );

      if (!flightAuthToken) {
        return res.status(401).json({
          success: false,
          message: "Failed to retrieve flight authentication token"
        });
      }

      const response = await FlightPassengerService.savePassengers(
        itineraryCode,
        bookingData,
        flightAuthToken
      );

      return res.status(200).json({
        success: true,
        data: response
      });

    } catch (error) {
      // console.error('Flight Allocation Error:', error);
      return res.status(error.status || 500).json({
        success: false,
        errorCode: error.error.error.errorCode,
        message: error.error.error.errorMessage,
        status: error.status
      });
    }
  }

  static async allocateHotelRooms(req, res) {
    try {
      const { hotelData } = req.body;
      const { itineraryCode } = hotelData[0];
      const bookingData = hotelData[0].bookingArray;

      const hotelAuthToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );

      if (!hotelAuthToken) {
        return res.status(401).json({
          success: false,
          message: "Failed to retrieve hotel authentication token"
        });
      }

      const response = await HotelRoomService.allocateRooms(
        itineraryCode,
        bookingData,
        hotelAuthToken
      );

      return res.status(200).json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Hotel Allocation Error:', error);
      return res.status(error.error?.httpStatusCode || error.status || 500).json({
        success: false,
        errorCode: error.error?.error?.code || null,
        message: error.error?.error?.message || error.error?.message || "An unexpected error occurred",
        errors: Array.isArray(error.error?.error?.errors) ? error.error.error.errors : [],
        status: error.error?.httpStatusCode || error.status || 500
      });
      
    }
  }
}

module.exports = GuestAllocationController;