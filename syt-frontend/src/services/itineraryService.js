import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/itineraryInquiry';

const itineraryService = {
  getItinerary: async (token) => {
    try {
      const response = await axios.get(`${BASE_URL}/${token}`);
      return response.data;
    } catch (error) {
      throw new Error('Error fetching itinerary data');
    }
  }
};

export default itineraryService;
