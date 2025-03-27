const express = require('express');
const router = express.Router();
const CountryController = require('../controllers/countryController');

// Define the route to get all countries
router.get('/', CountryController.getAllCountries);

// Define the route to get a country by code
router.get('/:code', CountryController.getCountryByCode);

module.exports = router;
