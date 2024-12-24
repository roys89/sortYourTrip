const Destination = require('../models/Destination');

// Get all destinations
exports.getDestinations = async (req, res) => {
  try {
    const destinations = await Destination.find({});
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a destination
exports.addDestination = async (req, res) => {
  const {
    destination_id,
    name,
    city,
    iata,
    description,
    lat,
    long,
    country,
    continent,
    ranking,
    rating,
    imageUrl,
    isActive,
    promoted,
  } = req.body;

  try {
    const newDestination = new Destination({
      destination_id,
      name,
      city,
      iata,
      description,
      lat,
      long,
      country,
      continent,
      ranking,
      rating,
      imageUrl,
      isActive,
      promoted,
    });

    const savedDestination = await newDestination.save();
    res.json(savedDestination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Search destinations with exact match for continent or country
exports.searchDestinations = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'No search query provided' });
    }

    const lowercaseQuery = query.toLowerCase();

    // Step 1: Check for exact match on continent, country, or city
    const exactMatches = await Destination.find({
      $or: [
        { continent: { $regex: new RegExp(`^${lowercaseQuery}$`, 'i') } },
        { country: { $regex: new RegExp(`^${lowercaseQuery}$`, 'i') } },
        { city: { $regex: new RegExp(`^${lowercaseQuery}$`, 'i') } }
      ]
    });

    if (exactMatches.length > 0) {
      const formattedResults = exactMatches.map(destination => {
        if (destination.continent.toLowerCase() === lowercaseQuery) {
          return { name: destination.continent, type: 'continent' };
        } else if (destination.country.toLowerCase() === lowercaseQuery) {
          return { name: `${destination.country} - ${destination.continent}`, type: 'country' };
        } else {
          return {
            name: `${destination.city} - ${destination.country}`,
            type: 'city',
            destination_id: destination.destination_id,
            country: destination.country,
            continent: destination.continent,
            ranking: destination.ranking,
            imageUrl: destination.imageUrl
          };
        }
      });
      return res.json(formattedResults);
    }

    // Step 2: If no exact match, proceed to broader search
    const broadSearchResults = await Destination.find({
      $or: [
        { city: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } },
        { continent: { $regex: query, $options: 'i' } }
      ]
    });

    const formattedBroadResults = broadSearchResults.map(destination => {
      if (destination.city.toLowerCase().includes(lowercaseQuery)) {
        return {
          name: `${destination.city} - ${destination.country}`,
          type: 'city',
          destination_id: destination.destination_id,
          country: destination.country,
          continent: destination.continent,
          ranking: destination.ranking,
          imageUrl: destination.imageUrl
        };
      } else if (destination.country.toLowerCase().includes(lowercaseQuery)) {
        return { name: `${destination.country} - ${destination.continent}`, type: 'country' };
      } else {
        return { name: destination.continent, type: 'continent' };
      }
    });

    return res.json(formattedBroadResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Get cities, countries, and continents for destination form
exports.getCitiesCountriesContinents = async (req, res) => {
  try {
    const cities = await Destination.find().distinct('city');
    const countries = await Destination.find().distinct('country');
    const continents = await Destination.find().distinct('continent');

    res.json({ cities, countries, continents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get promoted countries only
exports.getPromotedCountries = async (req, res) => {
  try {
    const countries = await Destination.find({ promoted: true }).distinct('country');
    res.json({ countries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top-rated cities in the same continent
exports.getTopRatedCitiesByContinent = async (req, res) => {
  const { continent } = req.params;

  try {
    const topRatedCities = await Destination.find({ continent })
      .sort({ rating: -1 })
      .limit(5);

    res.json(topRatedCities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Fetch cities based on destination and destinationType with neighboring countries support
const Country = require('../models/Country'); // Import the Country model

exports.getCitiesByDestination = async (req, res) => {
  const { destination, destinationType } = req.query;

  try {
    let cities = [];

    if (destinationType === 'continent') {
      // 1st Case: Fetch all cities from the specified continent
      cities = await Destination.find({ continent: destination }, {
        destination_id: 1, name: 1, lat: 1, long: 1, country: 1, continent: 1, rating: 1, ranking: 1, imageUrl: 1, city: 1, iata: 1 
      });

    } else if (destinationType === 'country') {
      // 2nd Case: Fetch cities from the given country and its neighboring countries
      const countryDetails = await Country.findOne({ name: destination });

      if (!countryDetails) {
        return res.status(404).json({ message: 'Country not found' });
      }

      // Fetch cities in the current country
      let allCities = await Destination.find({ country: destination }, {
        destination_id: 1, name: 1, lat: 1, long: 1, country: 1, continent: 1, rating: 1, ranking: 1, imageUrl: 1, city: 1, iata:1
      });

      // Fetch cities from neighboring countries
      const neighboringCountriesArray = countryDetails.neighboringCountries;
      if (neighboringCountriesArray && neighboringCountriesArray.length > 0) {
        const neighboringCities = await Destination.find(
          { country: { $in: neighboringCountriesArray } },
          { destination_id: 1, name: 1, lat: 1, long: 1, country: 1, continent: 1, rating: 1, ranking: 1, imageUrl: 1, city: 1, iata: 1 }
        );
        allCities = allCities.concat(neighboringCities);
      }

      cities = allCities;

    } else if (destinationType === 'city') {
      // 3rd Case: Fetch the country of the city, get neighboring countries, and get cities from them
      const [cityOnly] = destination.includes(' - ') ? destination.split(' - ') : [destination];

      // Find city details by city name
      const cityDetails = await Destination.findOne({ city: cityOnly });

      if (!cityDetails) {
        return res.status(404).json({ message: 'City not found' });
      }

      const { country } = cityDetails;

      // Fetch neighboring countries for this city from the Country collection
      const countryDetails = await Country.findOne({ name: country });
      if (!countryDetails) {
        return res.status(404).json({ message: 'Country not found' });
      }

      const neighboringCountriesArray = countryDetails.neighboringCountries;

      // Fetch cities in the current country
      let allCities = await Destination.find(
        { country: country },
        { destination_id: 1, name: 1, lat: 1, long: 1, country: 1, continent: 1, rating: 1, ranking: 1, imageUrl: 1, city: 1, iata: 1 }
      );

      // Fetch cities from neighboring countries
      if (neighboringCountriesArray.length > 0) {
        const neighboringCities = await Destination.find(
          { country: { $in: neighboringCountriesArray } },
          { destination_id: 1, name: 1, lat: 1, long: 1, country: 1, continent: 1, rating: 1, ranking: 1, imageUrl: 1, city: 1, iata: 1 }
        );
        allCities = allCities.concat(neighboringCities);
      }

      cities = allCities;
    }

    // Send back the cities as response
    res.json(cities);

  } catch (error) {
    console.error("Error in fetching cities:", error);
    res.status(500).json({ message: error.message });
  }
};


// Get countries from a specific continent
exports.getCountriesByContinent = async (req, res) => {
  const { continent } = req.query;

  try {
    const countries = await Country.find({ continent }).select('name destination_id');
    if (!countries.length) {
      return res.status(404).json({ message: 'No countries found for this continent' });
    }
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: error.message });
  }
};
