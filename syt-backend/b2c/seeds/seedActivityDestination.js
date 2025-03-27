const mongoose = require('mongoose');
const ActivityDestination = require('../models/itineraryModel/ActivityDestination'); // Adjust path as needed
require('dotenv').config(); // Load environment variables


  const Destination = [
    {
      destination_id: "1",
      destination_code: "6826",
      name: "Dubai",
      country: "United Arab Emirates",
      continent: "Asia"
    },
    {
      destination_id: "2",
      destination_code: "26",
      name: "Abu Dhabi",
      country: "United Arab Emirates",
      continent: "Asia"
    },
    {
      destination_id: "3",
      destination_code: "109083",
      name: "Ras Al Khaimah",
      country: "United Arab Emirates",
      continent: "Asia"
    },
    {
      destination_id: "4",
      destination_code: "5188",
      name: "Sharjah",
      country: "United Arab Emirates",
      continent: "Asia"
    },
    {
      destination_id: "5",
      destination_code: "68",
      name: "Al Ain",
      country: "United Arab Emirates",
      continent: "Asia"
    },
    {
      destination_id: "6",
      destination_code: "1961",
      name: "Fujairah",
      country: "United Arab Emirates",
      continent: "Asia"
    },
    {
      destination_id: "7",
      destination_code: "62",
      name: "Ajman",
      country: "United Arab Emirates",
      continent: "Asia"
    }
  ];

// Database connection
const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Database connected');
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1); // Exit with failure
    }
  };

// Seed function
const seedActivityDestination = async () => {
    try {
      await ActivityDestination.deleteMany(); // Clear existing data
      await ActivityDestination.insertMany(Destination); // Insert new data
      console.log('Successfully seeded city airports');
      mongoose.connection.close(); // Close the database connection
    } catch (error) {
      console.error('Error seeding city airports:', error);
      process.exit(1); // Exit with failure
    }
  };
  
  // Run the seed function
  const seedDB = async () => {
    await connectDB();
    await seedActivityDestination();
  };
  
  seedDB();