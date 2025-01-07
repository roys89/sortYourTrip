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
      date,
      selectedCities,
      originCity,
      destinationCity
    } = params;
  
    try {
      // Check if hotel objects have the required structure
      if (!originHotel?.data?.hotelDetails) {
        console.error('Origin hotel missing required data structure:', 
          JSON.stringify({
            hasHotel: !!originHotel,
            hasData: !!originHotel?.data,
            hasDetails: !!originHotel?.data?.hotelDetails
          })
        );
        return null;
      }
  
      if (!destinationHotel?.data?.hotelDetails) {
        console.error('Destination hotel missing required data structure:', 
          JSON.stringify({
            hasHotel: !!destinationHotel,
            hasData: !!destinationHotel?.data,
            hasDetails: !!destinationHotel?.data?.hotelDetails
          })
        );
        return null;
      }
  
      // First try ground transfer
      const transferResult = await getGroundTransfer({
        travelers: travelersDetails,
        inquiryToken: inquiryToken,
        preferences: preferences,
        startDate: date,
        origin: {
          type: "hotel",
          city: originHotel.data.hotelDetails.address.city.name,
          country: originHotel.data.hotelDetails.address.country.name,
          address: this.formatAddressToSingleLine(originHotel.data.hotelDetails.address),
          latitude: originHotel.data.hotelDetails.geolocation.lat,
          longitude: originHotel.data.hotelDetails.geolocation.long
        },
        destination: {
          type: "hotel",
          city: destinationHotel.data.hotelDetails.address.city.name,
          country: destinationHotel.data.hotelDetails.address.country.name,
          address: this.formatAddressToSingleLine(destinationHotel.data.hotelDetails.address),
          latitude: destinationHotel.data.hotelDetails.geolocation.lat,
          longitude: destinationHotel.data.hotelDetails.geolocation.long
        }
      });
  
      // If transfer duration > 300 minutes, switch to flight
      if (transferResult.type !== "error" && transferResult.duration > 300) {
        console.log('Ground transfer duration > 300 minutes, switching to flight');
  
        // Get the correct city objects with IATA codes from selectedCities
        const departureCity = selectedCities.find(city => city.city === originCity.city);
        const arrivalCity = selectedCities.find(city => city.city === destinationCity.city);
  
        if (!departureCity || !arrivalCity) {
          console.error('Could not find matching cities with IATA codes');
          // Fall back to ground transfer
          return {
            type: "city_to_city",
            details: transferResult
          };
        }
  
        // Try to get a flight with proper city structure
        const flight = await getFlights({
          inquiryToken,
          departureCity,    // This now has the correct structure with IATA code
          cities: [arrivalCity],  // This now has the correct structure with IATA code
          travelers: travelersDetails,
          departureDates: {
            startDate: date,
            endDate: date
          },
          type: "inter_city_flight"
        });
  
        if (flight && flight[0]) {
          // If flight is found, we need hotel to airport and airport to hotel transfers
          const [hotelToAirport, airportToHotel] = await Promise.all([
            this.processHotelToAirportTransfer({
              flight: flight[0],
              hotel: originHotel,
              travelersDetails,
              inquiryToken,
              preferences,
              date
            }),
            this.processAirportToHotelTransfer({
              flight: flight[0],
              hotel: destinationHotel,
              travelersDetails,
              inquiryToken,
              preferences
            })
          ]);
  
          return {
            type: "inter_city_flight",
            details: flight[0],
            transfers: {
              hotelToAirport,
              airportToHotel
            }
          };
        }
      }
  
      // Either duration is acceptable or no flight found, use ground transfer
      return {
        type: "city_to_city",
        details: transferResult
      };
  
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