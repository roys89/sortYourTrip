// services/bookingService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/bookings';

// Get token from localStorage
const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

class BookingService {
  // Create new booking
  async createBooking(bookingData) {
    try {
      const response = await axios.post(API_URL, bookingData, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user's bookings
  async getUserBookings() {
    try {
      const response = await axios.get(`${API_URL}/user`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get booking status
  async getBookingStatus(itineraryToken) {
    try {
      const response = await axios.get(
        `${API_URL}/status/${itineraryToken}`, 
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single booking
  async getBooking(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

// Resolve ESLint warning by assigning instance to a variable before exporting
const bookingService = new BookingService();
export default bookingService;