// services/LocationSearchService.js
const axios = require('axios');

class LocationSearchService {
  constructor() {
    this.API_KEY = '88D75FF476AD403BAE5363F6B6EFDD53';
    this.BASE_URL = 'https://api.content.tripadvisor.com/api/v1/location/search';
  }

  /**
   * Search for a location by name, category, and address
   * @param {string} searchQuery - The name of the location to search for
   * @param {string} category - The category of the location (attractions, hotels, etc.)
   * @param {string} address - The address of the location (optional)
   * @param {string} language - The language for the results (default: en)
   * @returns {Promise<Object>} - The search results
   */
  async searchLocation(searchQuery, category, address, language = 'en') {
    try {
      const url = this.BASE_URL;
      
      // Create base params
      const params = {
        key: this.API_KEY,
        searchQuery: encodeURIComponent(searchQuery),
        category: category,
        language: language
      };
      
      // Only add address parameter if it's provided
      if (address) {
        params.address = encodeURIComponent(address);
      }

      // console.log(`Searching for ${searchQuery} with params:`, 
      //   Object.keys(params).reduce((result, key) => {
      //     // Hide API key from logs
      //     result[key] = key === 'key' ? '[HIDDEN]' : params[key];
      //     return result;
      //   }, {})
      // );
      
      const response = await axios.get(url, {
        params,
        headers: { accept: 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('Error in LocationSearchService:', error.message);
      if (error.response) {
        console.error('TripAdvisor API Response:', error.response.data);
      }
      throw new Error('Failed to search TripAdvisor location');
    }
  }

  /**
   * Find the best matching location from search results
   * @param {Array} searchResults - The search results
   * @param {string} name - The name to match
   * @param {string} city - The city to match
   * @param {string} country - The country to match
   * @returns {string|null} - The location_id of the best match or null
   */
  findBestMatchingLocation(searchResults, name, city, country) {
    if (!searchResults || !searchResults.data || searchResults.data.length === 0) {
      console.log('No search results found');
      return null;
    }



    // Try to find exact name match first
    const exactNameMatch = searchResults.data.find(
      location => 
        location.name.toLowerCase() === name.toLowerCase() && 
        (
          !location.address_obj?.city ||
          !city ||
          location.address_obj.city.toLowerCase() === city.toLowerCase()
        ) &&
        (
          !location.address_obj?.country ||
          !country ||
          location.address_obj.country.toLowerCase() === country.toLowerCase()
        )
    );

    if (exactNameMatch) {
      console.log(`Found exact name match: ${exactNameMatch.name} (${exactNameMatch.location_id})`);
      return exactNameMatch.location_id;
    }

    // Try partial name match with name as substring
    const partialNameMatch = searchResults.data.find(
      location => 
        location.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(location.name.toLowerCase())
    );

    if (partialNameMatch) {
      // console.log(`Found partial name match: ${partialNameMatch.name} (${partialNameMatch.location_id})`);
      return partialNameMatch.location_id;
    }

    // If no name match, find a match in the same city/country
    const cityCountryMatch = searchResults.data.find(
      location => 
        location.address_obj?.city?.toLowerCase() === city.toLowerCase() &&
        (!country || !location.address_obj?.country || location.address_obj.country.toLowerCase() === country.toLowerCase())
    );

    if (cityCountryMatch) {
      // console.log(`Found city/country match: ${cityCountryMatch.name} (${cityCountryMatch.location_id})`);
      return cityCountryMatch.location_id;
    }

    // If no match, just return the first result
    // console.log(`Using first result: ${searchResults.data[0].name} (${searchResults.data[0].location_id})`);
    return searchResults.data[0].location_id;
  }
}

module.exports = new LocationSearchService();