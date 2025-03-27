const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const HotelCity = require('../models/itineraryModel/HotelCity');

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
    const cities = rows
      .map((row) => {
        const [cityCode, cityName, countryCode] = row.trim().split('\t');

        // Skip invalid rows and log warnings
        if (!cityCode || !cityName || !countryCode) {
          console.warn('Invalid row skipped:', row);
          return null;
        }

        return { cityCode, cityName, countryCode };
      })
      .filter(Boolean);

    // Debug log to verify parsed data
    console.log('Parsed data:', cities);

    // Insert data into the database
    await HotelCity.insertMany(cities);
    console.log('City data successfully imported!');
  } catch (err) {
    console.error('Error importing data:', err);
  } finally {
    mongoose.connection.close();
  }
};

// Specify the path to your TSV file
const filePath = path.join(__dirname, '..', 'city_master.tsv');
importTSVData(filePath);
