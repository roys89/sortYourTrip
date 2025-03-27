const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Activity = require('../models/itineraryModel/Activity');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    const activities = [
      {
        activityCode: "319590P1",
        activityType: "online",
        activityProvider: "GRNC",
        activityName: "Small-Group Self-Drive Speedboat Tour in Yas Island Mangroves",
        city: "Abu Dhabi",
        destinationCode: "26",
        country: "United Arab Emirates",
        continent: "Asia",
        budget: "Premium",
        timeSlot: "Flexible",
        isFlexibleTiming: true,
        preference: "Adventure",
        category: "Water Sports",
        duration: 1.5, // Average of 1-2 hours
        rating: 4.8,
        ranking: 8.5,
        mandatory: false,
        fullAddress: "Yas Island, Abu Dhabi, United Arab Emirates",
        description: "Pilot your own speedboat around Yas Island, making stops at iconic landmarks as well as Mangrove Alley where you can spot wildlife. So make sure to keep an eye out for flamingos wanting to say hi! \n\nTake a break on Yas Beach Island where you can have a swim or just relax and have a picnic. Then zoom your way to Heritage Island where traditional UAE architecture and wildlife such as ostriches and gazelle sightings await. \n\nLast but not least, cruise up close and personal past modern marvels like the award winning circular building, egg-shaped high-rises, and a stunning lineup of towers along the Al Raha Creek canal – it's like a mini Venice right here in Abu Dhabi!\n\nSo grab your sunglasses, pack your sense of adventure, and get ready to ride the waves in style with Rhino Riders – because the only thing better than being on the water is being in control of the fun!",
        imageUrl: "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/0b/f3/7d/20.jpg",
        activityPeriod: "All Day",
        inclusions: [],
        exclusions: [],
        itineraryItems: [],
        departureTimes: [
          {
            code: "319590P1-QbvQJDTLHX237JvZimwTOw==-06:00",
            time: "06:00",
            amount: 11290.0,
            currency: "INR"
          },
          {
            code: "319590P1-QbvQJDTLHX237JvZimwTOw==-08:00",
            time: "08:00",
            amount: 11290.0,
            currency: "INR"
          },
          {
            code: "319590P1-QbvQJDTLHX237JvZimwTOw==-10:00",
            time: "10:00",
            amount: 11290.0,
            currency: "INR"
          },
          {
            code: "319590P1-QbvQJDTLHX237JvZimwTOw==-12:00",
            time: "12:00",
            amount: 11290.0,
            currency: "INR"
          },
          {
            code: "319590P1-QbvQJDTLHX237JvZimwTOw==-14:30",
            time: "14:30",
            amount: 11290.0,
            currency: "INR"
          },
          {
            code: "319590P1-QbvQJDTLHX237JvZimwTOw==-17:00",
            time: "17:00",
            amount: 11290.0,
            currency: "INR"
          }
        ]
      }
    ];

    return Activity.insertMany(activities);
  })
  .then(() => {
    console.log('Activities inserted successfully');
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('Error inserting activities:', error);
    mongoose.connection.close();
  });