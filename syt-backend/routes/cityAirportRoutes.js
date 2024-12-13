const express = require('express');
const { getCitiesWithAirports } = require('../controllers/cityAirportController');
const router = express.Router();

// Route to get cities with airports
router.get('/', getCitiesWithAirports);

module.exports = router;
