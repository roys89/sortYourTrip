const CityAirport = require('../models/CityAirport'); // Ensure this path is correct

// Controller to get cities with airports
exports.getCitiesWithAirports = async (req, res) => {
  try {
    const cities = await CityAirport.find(); // Fetch all cities with airports
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities with airports:', error);
    res.status(500).json({ message: 'Error fetching cities with airports' });
  }
};
