const express = require('express');
const {
  getDestinations,
  addDestination,
  searchDestinations,
  getCitiesCountriesContinents,getCountriesByContinent,
  getTopRatedCitiesByContinent,getCitiesByDestination,
  getPromotedCountries // Import the controller function
} = require('../controllers/destinationController');

const router = express.Router();

// Define routes
router.get('/', getDestinations);
router.get('/search', searchDestinations);
router.post('/', addDestination);
router.get('/cities', getCitiesByDestination);
router.get('/locations', getCitiesCountriesContinents);
router.get('/promoted-countries', getPromotedCountries); // Route for promoted countries
router.get('/top-rated/:continent', getTopRatedCitiesByContinent);
router.get('/countries-by-continent', getCountriesByContinent);

module.exports = router;