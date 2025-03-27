// services/LocationDetailsService.js
const axios = require('axios');

class LocationDetailsService {
  constructor() {
    this.API_KEY = '88D75FF476AD403BAE5363F6B6EFDD53';
    this.BASE_URL = 'https://api.content.tripadvisor.com/api/v1/location';
  }

  /**
   * Get location details by location_id
   * @param {string} locationId - The TripAdvisor location ID
   * @param {string} language - The language for the results (default: en)
   * @param {string} currency - The currency for pricing (default: USD)
   * @returns {Promise<Object>} - The location details
   */
  async getLocationDetails(locationId, language = 'en', currency = 'USD') {
    try {
      const url = `${this.BASE_URL}/${locationId}/details`;
      const params = {
        key: this.API_KEY,
        language: language,
        currency: currency
      };

      console.log(`Fetching details for location ID: ${locationId}`);
      
      const response = await axios.get(url, {
        params,
        headers: { accept: 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('Error in LocationDetailsService:', error.message);
      throw new Error('Failed to get TripAdvisor location details');
    }
  }
}

module.exports = new LocationDetailsService();