const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Hotel = require('../models/itineraryModel/Hotel');

// Connect to MongoDB using the URI from the .env file
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Function to read and import TSV data
const importTSVData = async (filePath) => {
  try {
    // Check if the file exists and is valid
    if (!fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()) {
      throw new Error('File path is invalid or points to a directory: ' + filePath);
    }

    // Read the TSV file
    const data = fs.readFileSync(filePath, 'utf8');

    // Split into rows and skip the header row
    const rows = data.split('\n').slice(1);

    // Parse each row and validate fields
    const hotels = rows
      .map((row) => {
        const fields = row.trim().split('\t');
        const [
          hotelCode,
          hotelName,
          description,
          cityCode,
          destinationCode,
          countryCode,
          starCategory,
          address,
          postalCode,
          latitude,
          longitude,
          accommodationType,
          accommodationTypeSubName,
          chainName,
          featured,
        ] = fields;

        // Skip invalid rows and log warnings
        if (!hotelCode || !hotelName || !cityCode || !countryCode) {
          console.warn('Invalid row skipped:', row);
          return null;
        }

        return {
          hotelCode,
          hotelName,
          description,
          cityCode,
          destinationCode,
          countryCode,
          starCategory: parseInt(starCategory) || null,
          address,
          postalCode,
          latitude: parseFloat(latitude) || null,
          longitude: parseFloat(longitude) || null,
          accommodationType,
          accommodationTypeSubName,
          chainName,
          featured: featured === '1',
        };
      })
      .filter(Boolean);

    // Debug log to verify parsed data
    console.log('Parsed data:', hotels);

    // Insert data into the database
    await Hotel.insertMany(hotels);
    console.log('Hotel data successfully imported!');
  } catch (err) {
    console.error('Error importing data:', err);
  } finally {
    mongoose.connection.close();
  }
};

// Specify the path to your TSV file
const filePath = path.join(__dirname, '..', 'hotel_master.10k-20k.tsv');
importTSVData(filePath);
