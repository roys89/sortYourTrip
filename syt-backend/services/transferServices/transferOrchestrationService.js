// services/transferServices/transferOrchestrationService.js

const { getGroundTransfer } = require('../../controllers/itineraryController/transferControllerLA');
const { getFlights } = require('../../controllers/itineraryController/flightControllerTC');

class TransferOrchestrationService {
  formatLocationForTransfer(location, type) {
    if (!location?.latitude || !location?.longitude) {
      throw new Error(`Missing geolocation data for ${type}`);
    }

    return {
      city: location.city,
      country: location.country,
      address: location.address,
      latitude: parseFloat(location.latitude || location.lat),
      longitude: parseFloat(location.longitude || location.long),
    };
  }

  formatAddressToSingleLine(addressObj) {
    if (!addressObj) return null;

    const parts = [
      addressObj.line1,
      addressObj.city?.name,
      addressObj.country?.name,
      addressObj.postalCode ? `Postal Code ${addressObj.postalCode}` : null
    ];

    return parts.filter(Boolean).join(', ');
  }

  async processAirportToHotelTransfer(params) {
    const {
      flight,
      hotel,
      travelersDetails,
      inquiryToken,
      preferences
    } = params;

    try {
      const airportLocation = this.formatLocationForTransfer({
        city: flight.destination,
        country: flight.arrivalAirport.country,
        address: flight.arrivalAirport.name,
        latitude: flight.arrivalAirport.location.latitude,
        longitude: flight.arrivalAirport.location.longitude
      }, 'airport');

      const hotelLocation = this.formatLocationForTransfer({
        city: hotel.data.hotelDetails.address.city.name,
        country: hotel.data.hotelDetails.address.country.name,
        address: this.formatAddressToSingleLine(hotel.data.hotelDetails.address),
        latitude: hotel.data.hotelDetails.geolocation.lat,
        longitude: hotel.data.hotelDetails.geolocation.long
      }, 'hotel');

      const transferResult = await getGroundTransfer({
        travelers: travelersDetails,
        inquiryToken: inquiryToken,
        preferences: preferences,
        startDate: flight.landingTime,
        origin: { type: "airport", ...airportLocation },
        destination: { type: "hotel", ...hotelLocation },
      });

      return transferResult.type !== "error" ? {
        type: "airport_to_hotel",
        details: transferResult
      } : null;
    } catch (error) {
      console.error('Error in processAirportToHotelTransfer:', error);
      return null;
    }
  }

  async processHotelToAirportTransfer(params) {
    const {
      flight,
      hotel,
      travelersDetails,
      inquiryToken,
      preferences,
      date
    } = params;

    try {
      const hotelLocation = this.formatLocationForTransfer({
        city: hotel.data.hotelDetails.address.city.name,
        country: hotel.data.hotelDetails.address.country.name,
        address: this.formatAddressToSingleLine(hotel.data.hotelDetails.address),
        latitude: hotel.data.hotelDetails.geolocation.lat,
        longitude: hotel.data.hotelDetails.geolocation.long
      }, 'hotel');

      const airportLocation = this.formatLocationForTransfer({
        city: flight.origin,
        country: flight.originAirport.country,
        address: flight.originAirport.name,
        latitude: flight.originAirport.location.latitude,
        longitude: flight.originAirport.location.longitude
      }, 'airport');

      const transferResult = await getGroundTransfer({
        travelers: travelersDetails,
        inquiryToken: inquiryToken,
        preferences: preferences,
        startDate: date,
        origin: { type: "hotel", ...hotelLocation },
        destination: { type: "airport", ...airportLocation },
      });

      return transferResult.type !== "error" ? {
        type: "hotel_to_airport",
        details: transferResult
      } : null;
    } catch (error) {
      console.error('Error in processHotelToAirportTransfer:', error);
      return null;
    }
  }

  async processCityToCityTransfer(params) {
    const {
      originHotel,
      destinationHotel,
      travelersDetails,
      inquiryToken,
      preferences,
      date
    } = params;

    try {
      const originLocation = this.formatLocationForTransfer({
        city: originHotel.data.hotelDetails.address.city.name,
        country: originHotel.data.hotelDetails.address.country.name,
        address: this.formatAddressToSingleLine(originHotel.data.hotelDetails.address),
        latitude: originHotel.data.hotelDetails.geolocation.lat,
        longitude: originHotel.data.hotelDetails.geolocation.long
      }, 'origin hotel');

      const destinationLocation = this.formatLocationForTransfer({
        city: destinationHotel.data.hotelDetails.address.city.name,
        country: destinationHotel.data.hotelDetails.address.country.name,
        address: this.formatAddressToSingleLine(destinationHotel.data.hotelDetails.address),
        latitude: destinationHotel.data.hotelDetails.geolocation.lat,
        longitude: destinationHotel.data.hotelDetails.geolocation.long
      }, 'destination hotel');

      const transferResult = await getGroundTransfer({
        travelers: travelersDetails,
        inquiryToken: inquiryToken,
        preferences: preferences,
        startDate: date,
        origin: { type: "hotel", ...originLocation },
        destination: { type: "hotel", ...destinationLocation },
      });

      // If transfer duration > 8 hours, switch to flight
      if (transferResult.type !== "error" && transferResult.duration > 480) {
        return await this.processInterCityFlight({
          originCity: originLocation,
          destinationCity: destinationLocation,
          travelersDetails,
          inquiryToken,
          preferences,
          date
        });
      }

      return transferResult.type !== "error" ? {
        type: "city_to_city",
        details: transferResult
      } : null;
    } catch (error) {
      console.error('Error in processCityToCityTransfer:', error);
      return null;
    }
  }

  async processInterCityFlight(params) {
    const {
      originCity,
      destinationCity,
      travelersDetails,
      inquiryToken,
      preferences,
      date
    } = params;

    try {
      const flights = await getFlights({
        inquiryToken: inquiryToken,
        departureCity: originCity,
        cities: [destinationCity],
        travelers: travelersDetails,
        departureDates: {
          startDate: date,
          endDate: date
        },
        includeDetailedLandingInfo: true,
        type: "inter_city_flight",
      });

      return flights?.[0] ? {
        type: "inter_city_flight",
        details: flights[0]
      } : null;
    } catch (error) {
      console.error('Error in processInterCityFlight:', error);
      return null;
    }
  }

  async updateTransfersForHotelChange(params) {
    const {
      itinerary,
      cityName,
      date,
      newHotelDetails,
      inquiryToken
    } = params;

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) throw new Error('City not found');

    const day = itinerary.cities[cityIndex].days.find(d => d.date === date);
    if (!day) throw new Error('Day not found');

    const updatedTransfers = [];

    // Handle first city airport to hotel transfer
    if (cityIndex === 0 && day.flights?.length > 0) {
      const airportTransfer = await this.processAirportToHotelTransfer({
        flight: day.flights[0].flightData,
        hotel: { data: newHotelDetails },
        travelersDetails: itinerary.travelersDetails,
        inquiryToken,
        preferences: itinerary.preferences
      });
      if (airportTransfer) updatedTransfers.push(airportTransfer);
    }

    // Handle city to city transfers
    if (cityIndex > 0) {
      const prevCity = itinerary.cities[cityIndex - 1];
      const prevHotel = prevCity.days[prevCity.days.length - 1].hotels[0];

      const cityTransfer = await this.processCityToCityTransfer({
        originHotel: prevHotel,
        destinationHotel: { data: newHotelDetails },
        travelersDetails: itinerary.travelersDetails,
        inquiryToken,
        preferences: itinerary.preferences,
        date
      });
      if (cityTransfer) updatedTransfers.push(cityTransfer);
    }

    // Handle last city hotel to airport transfer
    const isLastCity = cityIndex === itinerary.cities.length - 1;
    if (isLastCity && day.flights?.length > 0) {
      const airportTransfer = await this.processHotelToAirportTransfer({
        flight: day.flights[day.flights.length - 1].flightData,
        hotel: { data: newHotelDetails },
        travelersDetails: itinerary.travelersDetails,
        inquiryToken,
        preferences: itinerary.preferences,
        date
      });
      if (airportTransfer) updatedTransfers.push(airportTransfer);
    }

    return updatedTransfers;
  }
}

module.exports = new TransferOrchestrationService();