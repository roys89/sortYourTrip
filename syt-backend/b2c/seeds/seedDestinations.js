const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Destination = require('../models/Destination');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    try {
      // First clear existing data
      await Destination.deleteMany({});
      console.log('Cleared existing destinations');

      const destinations = [
      {
        destination_id: "3",
        name: "Muscat",
        city: "Muscat",
        description: "The capital city known for its beautiful architecture and waterfront.",
        lat: 23.588,
        long: 58.3829,
        country: "Oman",
        continent: "Asia",
        ranking: 1,
        rating: 4.6,
        iata: "MCT",
        imageUrl: "/assets/images/cities/d11.jpeg",
        isActive: true,
        promoted: false
      },
      {
        destination_id: "4",
        name: "Doha",
        city: "Doha",
        description: "A cultural institution showcasing art and heritage of Qatar.",
        lat: 25.2953,
        long: 51.5136,
        country: "Qatar",
        continent: "Asia",
        ranking: 4,
        rating: 4.8,
        iata: "QM1",
        imageUrl: "/assets/images/cities/d19.jpeg",
        isActive: true,
        promoted: false
      },
      {
        destination_id: "2",
        name: "Abu Dhabi",
        city: "Abu Dhabi",
        description: "The capital of UAE, known for its cultural landmarks and luxury shopping.",
        lat: 24.453884,
        long: 54.3773438,
        country: "United Arab Emirates",
        continent: "Asia",
        ranking: 2,
        rating: 4.8,
        iata: "AUH",
        imageUrl: "/assets/images/cities/d2.jpeg",
        isActive: true,
        promoted: false
      },
      {
        destination_id: "5",
        name: "Fujairah",
        city: "Fujairah",
        description: "Known for its beaches and the Hajar Mountains.",
        lat: 25.128809,
        long: 56.326485,
        country: "United Arab Emirates",
        continent: "Asia",
        ranking: 5,
        rating: 4.6,
        iata: "FJR",
        imageUrl: "/assets/images/cities/d5.jpeg",
        isActive: true,
        promoted: false
      },
      {
        destination_id: "6",
        name: "Salalah",
        city: "Salalah",
        description: "Known for its lush greenery and stunning beaches, especially during the monsoon season.",
        lat: 17.0164,
        long: 54.0923,
        country: "Oman",
        continent: "Asia",
        ranking: 2,
        rating: 4.7,
        iata: "SLL",
        imageUrl: "/assets/images/cities/d12.jpeg",
        isActive: true,
        promoted: false
      },
      {
        destination_id: "7",
        name: "Sharjah",
        city: "Sharjah",
        description: "Known for its art, heritage, and cultural museums.",
        lat: 25.346255,
        long: 55.421065,
        country: "United Arab Emirates",
        continent: "Asia",
        ranking: 3,
        rating: 4.7,
        iata: "SHJ",
        imageUrl: "/assets/images/cities/d3.jpeg",
        isActive: true,
        promoted: false
      },
      {
        destination_id: "1",
        name: "Dubai",
        city: "Dubai",
        description: "A global city known for its skyscrapers, shopping, and nightlife.",
        lat: 25.276987,
        long: 55.296249,
        country: "United Arab Emirates",
        continent: "Asia",
        ranking: 1,
        rating: 4.9,
        iata: "DXB",
        imageUrl: "/assets/images/cities/d1.jpeg",
        isActive: true,
        promoted: true
      },
      {
        destination_id: "8",
        name: "Ajman",
        city: "Ajman",
        description: "A smaller city known for its beaches and relaxed atmosphere.",
        lat: 25.405217,
        long: 55.5136433,
        country: "United Arab Emirates",
        continent: "Asia",
        ranking: 4,
        rating: 4.5,
        iata: "AJM",
        imageUrl: "/assets/images/cities/d4.jpeg",
        isActive: true,
        promoted: false
      }
    ];

    // Log each destination before insertion for debugging
    destinations.forEach((dest, index) => {
      console.log(`Validating destination ${index + 1}:`, {
        destination_id: dest.destination_id,
        iata: dest.iata,
        name: dest.name
      });
    });

    // Insert destinations one by one to identify problematic records
    for (const destination of destinations) {
      try {
        await Destination.create(destination);
        console.log(`Successfully inserted: ${destination.name}`);
      } catch (error) {
        console.error(`Error inserting ${destination.name}:`, error.message);
      }
    }

    console.log('Seeding completed');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});