const mongoose = require('mongoose');
const CityAirport = require('../models/CityAirport');
require('dotenv').config();

const cityAirports = [
  { 
    city: "Dubai", 
    name: "Dubai International Airport", 
    iata: "DXB", 
    country: "United Arab Emirates", 
    destination_id: 1,
    latitude: 25.2532,
    longitude: 55.3657
  },
  { 
    city: "Abu Dhabi", 
    name: "Abu Dhabi International Airport", 
    iata: "AUH", 
    country: "United Arab Emirates", 
    destination_id: 2,
    latitude: 24.4331,
    longitude: 54.6511
  },
  { 
    city: "Singapore", 
    name: "Singapore Changi Airport", 
    iata: "SIN", 
    country: "Singapore", 
    destination_id: getRandomDestinationId(),
    latitude: 1.3644,
    longitude: 103.9915
  },
  { 
    city: "Bangkok", 
    name: "Suvarnabhumi Airport", 
    iata: "BKK", 
    country: "Thailand", 
    destination_id: getRandomDestinationId(),
    latitude: 13.6900,
    longitude: 100.7501
  },
  { 
    city: "Tokyo", 
    name: "Narita International Airport", 
    iata: "NRT", 
    country: "Japan", 
    destination_id: getRandomDestinationId(),
    latitude: 35.7720,
    longitude: 140.3929
  },
  { 
    city: "Seoul", 
    name: "Incheon International Airport", 
    iata: "ICN", 
    country: "South Korea", 
    destination_id: getRandomDestinationId(),
    latitude: 37.4602,
    longitude: 126.4407
  },
  { 
    city: "Hong Kong", 
    name: "Hong Kong International Airport", 
    iata: "HKG", 
    country: "Hong Kong", 
    destination_id: getRandomDestinationId(),
    latitude: 22.3080,
    longitude: 113.9185
  },
  { 
    city: "Kuala Lumpur", 
    name: "Kuala Lumpur International Airport", 
    iata: "KUL", 
    country: "Malaysia", 
    destination_id: getRandomDestinationId(),
    latitude: 2.7456,
    longitude: 101.7072
  },
  { 
    city: "Beijing", 
    name: "Beijing Capital International Airport", 
    iata: "PEK", 
    country: "China", 
    destination_id: getRandomDestinationId(),
    latitude: 40.0799,
    longitude: 116.6031
  },
  { 
    city: "Shanghai", 
    name: "Shanghai Pudong International Airport", 
    iata: "PVG", 
    country: "China", 
    destination_id: getRandomDestinationId(),
    latitude: 31.1443,
    longitude: 121.8083
  },
  { 
    city: "Manila", 
    name: "Ninoy Aquino International Airport", 
    iata: "MNL", 
    country: "Philippines", 
    destination_id: getRandomDestinationId(),
    latitude: 14.5086,
    longitude: 121.0194
  },
  { 
    city: "Delhi", 
    name: "Indira Gandhi International Airport", 
    iata: "DEL", 
    country: "India", 
    destination_id: getRandomDestinationId(),
    latitude: 28.5562,
    longitude: 77.1000
  },
  { 
    city: "Mumbai", 
    name: "Chhatrapati Shivaji Maharaj International Airport", 
    iata: "BOM", 
    country: "India", 
    destination_id: getRandomDestinationId(),
    latitude: 19.0896,
    longitude: 72.8656
  },
  { 
    city: "Bangalore", 
    name: "Kempegowda International Airport", 
    iata: "BLR", 
    country: "India", 
    destination_id: getRandomDestinationId(),
    latitude: 13.1986,
    longitude: 77.7066
  },
  { 
    city: "Chennai", 
    name: "Chennai International Airport", 
    iata: "MAA", 
    country: "India", 
    destination_id: getRandomDestinationId(),
    latitude: 12.9941,
    longitude: 80.1709
  },
  { 
    city: "Kolkata", 
    name: "Netaji Subhas Chandra Bose International Airport", 
    iata: "CCU", 
    country: "India", 
    destination_id: getRandomDestinationId(),
    latitude: 22.6520,
    longitude: 88.4463
  },
  { 
    city: "Hyderabad", 
    name: "Rajiv Gandhi International Airport", 
    iata: "HYD", 
    country: "India", 
    destination_id: getRandomDestinationId(),
    latitude: 17.2403,
    longitude: 78.4294
  },
  { 
    city: "Paris", 
    name: "Charles de Gaulle Airport", 
    iata: "CDG", 
    country: "France", 
    destination_id: getRandomDestinationId(),
    latitude: 49.0097,
    longitude: 2.5479
  },
  { 
    city: "London", 
    name: "Heathrow Airport", 
    iata: "LHR", 
    country: "United Kingdom", 
    destination_id: getRandomDestinationId(),
    latitude: 51.4700,
    longitude: -0.4543
  },
  { 
    city: "New York", 
    name: "John F. Kennedy International Airport", 
    iata: "JFK", 
    country: "United States", 
    destination_id: getRandomDestinationId(),
    latitude: 40.6413,
    longitude: -73.7781
  },
  { 
    city: "Los Angeles", 
    name: "Los Angeles International Airport", 
    iata: "LAX", 
    country: "United States", 
    destination_id: getRandomDestinationId(),
    latitude: 33.9416,
    longitude: -118.4085
  },
  { 
    city: "Sydney", 
    name: "Sydney Kingsford Smith International Airport", 
    iata: "SYD", 
    country: "Australia", 
    destination_id: getRandomDestinationId(),
    latitude: -33.9461,
    longitude: 151.1772
  },
  { 
    city: "Toronto", 
    name: "Toronto Pearson International Airport", 
    iata: "YYZ", 
    country: "Canada", 
    destination_id: getRandomDestinationId(),
    latitude: 43.6777,
    longitude: -79.6248
  },
  { 
    city: "Frankfurt", 
    name: "Frankfurt Airport", 
    iata: "FRA", 
    country: "Germany", 
    destination_id: getRandomDestinationId(),
    latitude: 50.0379,
    longitude: 8.5622
  },
  { 
    city: "Zurich", 
    name: "Zurich Airport", 
    iata: "ZRH", 
    country: "Switzerland", 
    destination_id: getRandomDestinationId(),
    latitude: 47.4582,
    longitude: 8.5555
  },
  { 
    city: "Doha", 
    name: "Hamad International Airport", 
    iata: "DOH", 
    country: "Qatar", 
    destination_id: 4,
    latitude: 25.2733,
    longitude: 51.6081
  },
  { 
    city: "Salalah", 
    name: "Salalah International Airport", 
    iata: "SLL", 
    country: "Oman", 
    destination_id: 6,
    latitude: 17.0387,
    longitude: 54.0913
  },
  { 
    city: "Sharjah", 
    name: "Sharjah International Airport", 
    iata: "SHJ", 
    country: "United Arab Emirates", 
    destination_id: 7,
    latitude: 25.3286,
    longitude: 55.5172
  },
  { 
    city: "Muscat", 
    name: "Muscat International Airport", 
    iata: "MCT", 
    country: "Oman", 
    destination_id: 3,
    latitude: 23.5932,
    longitude: 58.2844
  }
];

function getRandomDestinationId() {
  return Math.floor(Math.random() * 999) + 1;
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedCitiesWithAirports = async () => {
  try {
    await CityAirport.deleteMany();
    await CityAirport.insertMany(cityAirports);
    console.log('Successfully seeded city airports');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding city airports:', error);
    process.exit(1);
  }
};

const seedDB = async () => {
  await connectDB();
  await seedCitiesWithAirports();
};

seedDB();