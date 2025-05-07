// controllers/TripAdvisorController.js
const LocationSearchService = require('../../services/tripAdvisorServices/LocationSearchService');
const LocationDetailsService = require('../../services/tripAdvisorServices/LocationDetailsService');
const { validationResult } = require('express-validator');

class TripAdvisorController {
    /**
     * Get TripAdvisor details for a location
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - TripAdvisor location details
     */
    async getLocationDetails(req, res) {
      try {
        const { name, category, city, country, address } = req.body;
        
        // Validate required fields
        if (!name || !city) {
          return res.status(400).json({ 
            error: "Name and city are required" 
          });
        }
        
        // Use provided category or default based on endpoint
        const searchCategory = category || (req.path.includes('hotel') ? 'hotels' : 'attractions');
        
        // Construct search query
        let searchParams = {
          searchQuery: name,
          category: searchCategory,
          language: 'en'
        };
        
        // Only add address if it was provided
        if (address) {
          searchParams.address = address;
        } else if (city && country) {
          // If no address but we have city and country, use them
          searchParams.address = `${city} - ${country}`;
        } else if (city) {
          // If only city is available
          searchParams.address = city;
        }
  
       
        // Step 1: Call LocationSearchService to search for the location
        const searchResults = await LocationSearchService.searchLocation(
          searchParams.searchQuery,
          searchParams.category,
          searchParams.address,
          searchParams.language
        );
  
        // Find the best matching location
        const locationId = LocationSearchService.findBestMatchingLocation(
          searchResults,
          name,
          city,
          country
        );
  
        if (!locationId) {
          return res.status(404).json({ 
            error: "No matching location found on TripAdvisor" 
          });
        }
  

  
        // Step 2: Call LocationDetailsService to get location details
        const locationDetails = await LocationDetailsService.getLocationDetails(locationId);
  
        // Return relevant details to frontend
        return res.status(200).json({
          success: true,
          data: {
            location_id: locationDetails.location_id,
            name: locationDetails.name,
            rating: locationDetails.rating,
            rating_image_url: locationDetails.rating_image_url,
            num_reviews: locationDetails.num_reviews,
            web_url: locationDetails.web_url,
            photo_count: locationDetails.photo_count,
            ranking_data: locationDetails.ranking_data
          }
        });
      } catch (error) {
        console.error('Error in TripAdvisorController.getLocationDetails:', error);
        return res.status(500).json({ 
          error: "Failed to retrieve TripAdvisor details",
          message: error.message 
        });
      }
    }
  
    /**
     * Get TripAdvisor details for an activity
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getActivityRating(req, res) {
      req.body.category = 'attractions';
      return this.getLocationDetails(req, res);
    }
  
    /**
     * Get TripAdvisor details for a hotel
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getHotelRating(req, res) {
      req.body.category = 'hotels';
      return this.getLocationDetails(req, res);
    }
  }
  
  module.exports = new TripAdvisorController();