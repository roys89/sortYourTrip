// services/transferServices/transferOrchestrationService.js

const { getGroundTransfer } = require('../../controllers/itineraryController/transferControllerLA');
const { getFlights } = require('../../controllers/itineraryController/flightControllerTC');
const apiLogger = require('../../helpers/apiLogger');

class TransferOrchestrationService {
  // Helper function to parse and validate dates
  parseDepartureTime(departureTime, date) {
    try {
      // If departureTime is already an ISO string, return it
      if (departureTime && departureTime.includes('T')) {
        return new Date(departureTime);
      }

      // If we have a separate date and time
      if (date && departureTime) {
        // Parse time components
        const timeMatch = departureTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!timeMatch) {
          throw new Error('Invalid time format');
        }

        let [_, hours, minutes, period] = timeMatch;
        hours = parseInt(hours);
        minutes = parseInt(minutes);

        // Handle AM/PM if present
        if (period) {
          if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }

        // Create date object
        const dateObj = new Date(date);
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj;
      }

      // If no valid time format is found, use noon of the given date
      return new Date(date + 'T12:00:00.000Z');
    } catch (error) {
      console.error('Error parsing departure time:', error);
      // Fallback to noon of the given date
      return new Date(date + 'T12:00:00.000Z');
    }
  }

  // Helper function to normalize geolocation data
  getNormalizedGeolocation(hotelDetails) {
    return {
      latitude: hotelDetails?.geolocation?.lat || 
                hotelDetails?.geoCode?.lat || 
                hotelDetails?.geolocation?.latitude ||
                hotelDetails?.latitude,
      longitude: hotelDetails?.geolocation?.long || 
                 hotelDetails?.geoCode?.long || 
                 hotelDetails?.geolocation?.longitude ||
                 hotelDetails?.longitude
    };
  }

  // Helper function to format location data for transfer requests
  formatLocationForTransfer(location, type) {
    if (!location) {
      throw new Error(`Missing location data for ${type}`);
    }

    const geo = this.getNormalizedGeolocation(location);
    
    if (!geo.latitude || !geo.longitude) {
      throw new Error(`Missing geolocation data for ${type}`);
    }

    return {
      city: location.city,
      country: location.country,
      address: location.address || this.formatAddressToSingleLine(location.addressObj || location.address),
      latitude: parseFloat(geo.latitude),
      longitude: parseFloat(geo.longitude),
    };
  }

  // Helper function to format address to single line
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

  // Process airport to hotel transfer
  async processAirportToHotelTransfer(params) {
    const {
      flight,
      hotel,
      travelersDetails,
      inquiryToken,
      preferences
    } = params;

    try {
      console.log('Processing airport to hotel transfer:', {
        flight: flight?.flightCode,
        hotel: hotel?.data?.hotelDetails?.name,
        date: flight?.landingTime
      });

      if (!flight?.arrivalAirport || !hotel?.data?.hotelDetails) {
        throw new Error('Missing required flight or hotel data');
      }

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
        ...this.getNormalizedGeolocation(hotel.data.hotelDetails)
      }, 'hotel');

      // Parse landing time if needed
      const landingTime = this.parseDepartureTime(flight.landingTime, flight.arrivalDate);

      const transferResult = await getGroundTransfer({
        travelers: travelersDetails,
        inquiryToken: inquiryToken,
        preferences: preferences,
        startDate: landingTime.toISOString(),
        origin: { type: "airport", ...airportLocation },
        destination: { type: "hotel", ...hotelLocation },
        flightNumber: flight.flightCode
      });

      console.log('Airport to hotel transfer result:', {
        success: transferResult.type !== "error",
        type: transferResult.type,
        error: transferResult.type === "error" ? transferResult.message : null
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

  // Process hotel to airport transfer
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
      console.log('Processing hotel to airport transfer:', {
        flight: flight?.flightCode,
        hotel: hotel?.data?.hotelDetails?.name,
        date,
        departureTime: flight?.departureTime
      });

      if (!flight?.originAirport || !hotel?.data?.hotelDetails) {
        throw new Error('Missing required flight or hotel data');
      }

      const hotelLocation = this.formatLocationForTransfer({
        city: hotel.data.hotelDetails.address.city.name,
        country: hotel.data.hotelDetails.address.country.name,
        address: this.formatAddressToSingleLine(hotel.data.hotelDetails.address),
        ...this.getNormalizedGeolocation(hotel.data.hotelDetails)
      }, 'hotel');

      const airportLocation = this.formatLocationForTransfer({
        city: flight.origin,
        country: flight.originAirport.country,
        address: flight.originAirport.name,
        latitude: flight.originAirport.location.latitude,
        longitude: flight.originAirport.location.longitude
      }, 'airport');

      // Parse and validate departure time
      const departureDate = this.parseDepartureTime(flight.departureTime, date);
      
      // Calculate pickup time (4 hours before departure)
      const pickupTime = new Date(departureDate);
      pickupTime.setHours(pickupTime.getHours() - 4);

      // Validate calculated pickup time
      if (isNaN(pickupTime.getTime())) {
        console.warn('Invalid pickup time calculated, using 4 hours before noon');
        pickupTime = new Date(`${date}T08:00:00.000Z`); // Fallback to 8 AM
      }

      console.log('Calculated times:', {
        originalDeparture: flight.departureTime,
        parsedDeparture: departureDate.toISOString(),
        calculatedPickup: pickupTime.toISOString()
      });

      const transferResult = await getGroundTransfer({
        travelers: travelersDetails,
        inquiryToken: inquiryToken,
        preferences: preferences,
        startDate: pickupTime.toISOString(),
        origin: { type: "hotel", ...hotelLocation },
        destination: { type: "airport", ...airportLocation },
        flightNumber: flight.flightCode
      });

      console.log('Hotel to airport transfer result:', {
        success: transferResult.type !== "error",
        type: transferResult.type,
        error: transferResult.type === "error" ? transferResult.message : null
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

  // Process city to city transfer (with potential flight fallback)
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
      console.log('Processing city to city transfer:', {
        originCity: originCity?.city,
        destinationCity: destinationCity?.city,
        date
      });

      // Validate hotel data
      if (!originHotel?.data?.hotelDetails || !destinationHotel?.data?.hotelDetails) {
        console.error('Missing required hotel data:', {
          originHotel: !!originHotel?.data?.hotelDetails,
          destinationHotel: !!destinationHotel?.data?.hotelDetails
        });
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
          ...this.formatLocationForTransfer({
            city: originHotel.data.hotelDetails.address.city.name,
            country: originHotel.data.hotelDetails.address.country.name,
            address: this.formatAddressToSingleLine(originHotel.data.hotelDetails.address),
            ...this.getNormalizedGeolocation(originHotel.data.hotelDetails)
          }, 'origin hotel')
        },
        destination: {
          type: "hotel",
          ...this.formatLocationForTransfer({
            city: destinationHotel.data.hotelDetails.address.city.name,
            country: destinationHotel.data.hotelDetails.address.country.name,
            address: this.formatAddressToSingleLine(destinationHotel.data.hotelDetails.address),
            ...this.getNormalizedGeolocation(destinationHotel.data.hotelDetails)
          }, 'destination hotel')
        }
      });

      // If transfer duration > 300 minutes (5 hours), switch to flight
      if (transferResult.type !== "error" && transferResult.duration > 300) {
        console.log('Ground transfer duration exceeds 5 hours, attempting flight booking');
  
        const departureCity = selectedCities.find(city => city.city === originCity.city);
        const arrivalCity = selectedCities.find(city => city.city === destinationCity.city);
  
        if (!departureCity?.code || !arrivalCity?.code) {
          console.warn('Could not find valid city codes, falling back to ground transfer');
          return {
            type: "city_to_city",
            details: transferResult
          };
        }

        // Try to get a flight
        const flight = await getFlights({
          inquiryToken,
          departureCity: departureCity,
          cities: [arrivalCity],
          travelers: travelersDetails,
          departureDates: {
            startDate: date,
            endDate: date
          },
          type: "inter_city_flight"
        });

        if (flight?.[0]) {
          console.log('Found inter-city flight, processing connecting transfers');
          
          // Get airport transfers for both ends
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
  
      return {
        type: "city_to_city",
        details: transferResult
      };
  
    } catch (error) {
      console.error('Error in processCityToCityTransfer:', error);
      return null;
    }
  }

  // Update transfers for hotel change
  async updateTransfersForHotelChange(params) {
    const {
      itinerary,
      cityName,
      date,
      newHotelDetails,
      inquiryToken
    } = params;
  
    try {
      console.log('Starting transfer update for hotel change:', {
        cityName,
        date,
        hotelName: newHotelDetails?.hotelDetails?.name
      });
  
      const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
      if (cityIndex === -1) throw new Error('City not found');
  
      const currentCity = itinerary.cities[cityIndex];
      const currentCityFirstDay = currentCity.days[0];
      const currentCityLastDay = currentCity.days[currentCity.days.length - 1];
  
      // Case 1: First City
      if (cityIndex === 0) {
        // Handle arrival transfer if exists
        if (currentCityFirstDay.flights?.[0]?.flightData) {
          console.log('Processing first city arrival airport to hotel transfer');
          const arrivalTransfer = await this.processAirportToHotelTransfer({
            flight: currentCityFirstDay.flights[0].flightData,
            hotel: { data: newHotelDetails },
            travelersDetails: itinerary.travelersDetails,
            inquiryToken,
            preferences: itinerary.preferences
          });
  
          if (arrivalTransfer) {
            currentCityFirstDay.transfers = [arrivalTransfer];
          }
        }
  
        // Handle transfer to next city
        if (cityIndex < itinerary.cities.length - 1) {
          const nextCity = itinerary.cities[cityIndex + 1];
          const nextCityFirstDay = nextCity.days[0];
          const nextCityHotel = nextCityFirstDay.hotels[0];
  
          console.log('Processing first city to next city transfer');
          const cityTransfer = await this.processCityToCityTransfer({
            originHotel: { data: newHotelDetails },
            destinationHotel: nextCityHotel,
            travelersDetails: itinerary.travelersDetails,
            inquiryToken,
            preferences: itinerary.preferences,
            date: nextCity.startDate,
            originCity: currentCity,
            destinationCity: nextCity,
            selectedCities: itinerary.selectedCities
          });
  
          if (cityTransfer) {
            if (cityTransfer.type === "inter_city_flight") {
              // Add hotel to airport transfer to current city's last day
              currentCityLastDay.transfers = [cityTransfer.transfers.hotelToAirport];
              // Add flight and airport to hotel transfer to next city's first day
              nextCityFirstDay.flights = [{ flightData: cityTransfer.details }];
              nextCityFirstDay.transfers = [cityTransfer.transfers.airportToHotel];
            } else {
              // Add ground transfer to next city's first day
              nextCityFirstDay.transfers = [cityTransfer];
            }
          }
        }
      }
      // Case 2: Last City
      else if (cityIndex === itinerary.cities.length - 1) {
        // Handle transfer from previous city
        const prevCity = itinerary.cities[cityIndex - 1];
        const prevCityFirstDayHotel = prevCity.days[0].hotels[0];
        const prevCityLastDay = prevCity.days[prevCity.days.length - 1];
  
        console.log('Processing transfer from previous city to last city');
        const cityTransfer = await this.processCityToCityTransfer({
          originHotel: prevCityFirstDayHotel,
          destinationHotel: { data: newHotelDetails },
          travelersDetails: itinerary.travelersDetails,
          inquiryToken,
          preferences: itinerary.preferences,
          date: currentCity.startDate,
          originCity: prevCity,
          destinationCity: currentCity,
          selectedCities: itinerary.selectedCities
        });
  
        if (cityTransfer) {
          if (cityTransfer.type === "inter_city_flight") {
            // Add hotel to airport transfer to previous city's last day
            prevCityLastDay.transfers = [cityTransfer.transfers.hotelToAirport];
            // Add flight and airport to hotel transfer to current city's first day
            currentCityFirstDay.flights = [{ flightData: cityTransfer.details }];
            currentCityFirstDay.transfers = [cityTransfer.transfers.airportToHotel];
          } else {
            // Add ground transfer to current city's first day
            currentCityFirstDay.transfers = [cityTransfer];
          }
        }
  
        // Handle departure transfer if exists
        if (currentCityLastDay.flights?.[0]?.flightData) {
          console.log('Processing last city departure hotel to airport transfer');
          const departureTransfer = await this.processHotelToAirportTransfer({
            flight: currentCityLastDay.flights[0].flightData,
            hotel: { data: newHotelDetails },
            travelersDetails: itinerary.travelersDetails,
            inquiryToken,
            preferences: itinerary.preferences,
            date: currentCityLastDay.date
          });
  
          if (departureTransfer) {
            currentCityLastDay.transfers = [departureTransfer];
          }
        }
      }
      // Case 3: Middle City
      else {
        // Handle transfer from previous city
        const prevCity = itinerary.cities[cityIndex - 1];
        const prevCityFirstDayHotel = prevCity.days[0].hotels[0];
        const prevCityLastDay = prevCity.days[prevCity.days.length - 1];
  
        console.log('Processing transfer from previous city to middle city');
        const prevCityTransfer = await this.processCityToCityTransfer({
          originHotel: prevCityFirstDayHotel,
          destinationHotel: { data: newHotelDetails },
          travelersDetails: itinerary.travelersDetails,
          inquiryToken,
          preferences: itinerary.preferences,
          date: currentCity.startDate,
          originCity: prevCity,
          destinationCity: currentCity,
          selectedCities: itinerary.selectedCities
        });
  
        if (prevCityTransfer) {
          if (prevCityTransfer.type === "inter_city_flight") {
            // Add hotel to airport transfer to previous city's last day
            prevCityLastDay.transfers = [prevCityTransfer.transfers.hotelToAirport];
            // Add flight and airport to hotel transfer to current city's first day
            currentCityFirstDay.flights = [{ flightData: prevCityTransfer.details }];
            currentCityFirstDay.transfers = [prevCityTransfer.transfers.airportToHotel];
          } else {
            // Add ground transfer to current city's first day
            currentCityFirstDay.transfers = [prevCityTransfer];
          }
        }
  
        // Handle transfer to next city
        const nextCity = itinerary.cities[cityIndex + 1];
        const nextCityFirstDay = nextCity.days[0];
        const nextCityHotel = nextCityFirstDay.hotels[0];
  
        console.log('Processing transfer from middle city to next city');
        const nextCityTransfer = await this.processCityToCityTransfer({
          originHotel: { data: newHotelDetails },
          destinationHotel: nextCityHotel,
          travelersDetails: itinerary.travelersDetails,
          inquiryToken,
          preferences: itinerary.preferences,
          date: nextCity.startDate,
          originCity: currentCity,
          destinationCity: nextCity,
          selectedCities: itinerary.selectedCities
        });
  
        if (nextCityTransfer) {
          if (nextCityTransfer.type === "inter_city_flight") {
            // Add hotel to airport transfer to current city's last day
            currentCityLastDay.transfers = [nextCityTransfer.transfers.hotelToAirport];
            // Add flight and airport to hotel transfer to next city's first day
            nextCityFirstDay.flights = [{ flightData: nextCityTransfer.details }];
            nextCityFirstDay.transfers = [nextCityTransfer.transfers.airportToHotel];
          } else {
            // Add ground transfer to next city's first day
            nextCityFirstDay.transfers = [nextCityTransfer];
          }
        }
      }
  
      // Return the transfers for the specific day that was changed
      const dayIndex = currentCity.days.findIndex(d => d.date === date);
      if (dayIndex === -1) throw new Error('Day not found');
  
      return currentCity.days[dayIndex].transfers;
  
    } catch (error) {
      console.error('Error in updateTransfersForHotelChange:', error);
      throw error;
    }
  }


  // Get transfer options for manual selection
  async getTransferOptions(params) {
    const {
      travelers,
      inquiryToken,
      preferences,
      startDate,
      origin,
      destination
    } = params;

    try {
      console.log('Getting transfer options:', {
        origin: origin.city,
        destination: destination.city,
        date: startDate
      });

      // Get ground transfer options
      const transferResult = await getGroundTransfer({
        travelers,
        inquiryToken,
        preferences,
        startDate,
        origin,
        destination
      });

      if (transferResult.type === "error") {
        console.error('Error getting transfer options:', transferResult.message);
        return {
          success: false,
          message: transferResult.message,
          options: []
        };
      }

      // If duration > 5 hours, also get flight options
      const options = [transferResult];
      
      if (transferResult.duration > 300 && origin.type !== "airport" && destination.type !== "airport") {
        try {
          const flights = await this.getFlightOptions({
            origin: origin.city,
            destination: destination.city,
            date: startDate,
            travelers,
            inquiryToken
          });
          
          if (flights.length > 0) {
            options.push(...flights);
          }
        } catch (flightError) {
          console.error('Error getting flight options:', flightError);
        }
      }

      return {
        success: true,
        options: options.map(option => ({
          type: option.type,
          provider: option.transportationType === "transfer" ? option.transferProvider : "airline",
          duration: option.duration,
          price: option.type === "ground" ? option.selectedQuote.price : option.price,
          details: option
        }))
      };

    } catch (error) {
      console.error('Error in getTransferOptions:', error);
      return {
        success: false,
        message: error.message,
        options: []
      };
    }
  }

  // Revalidate existing transfer
  async revalidateTransfer(params) {
    const {
      travelers,
      inquiryToken,
      preferences,
      startDate,
      origin,
      destination
    } = params;

    try {
      console.log('Revalidating transfer:', {
        origin: origin.city,
        destination: destination.city,
        date: startDate
      });

      const transferResult = await getGroundTransfer({
        travelers,
        inquiryToken,
        preferences,
        startDate,
        origin,
        destination
      });

      return {
        success: transferResult.type !== "error",
        isValid: transferResult.type !== "error",
        newQuote: transferResult.type !== "error" ? transferResult : null,
        message: transferResult.type === "error" ? transferResult.message : null
      };

    } catch (error) {
      console.error('Error revalidating transfer:', error);
      return {
        success: false,
        isValid: false,
        message: error.message
      };
    }
  }

  // Update transfers for itinerary change
  async updateTransfersForChange(params) {
    const {
      itinerary,
      changeType,
      changeDetails,
      inquiryToken
    } = params;

    try {
      console.log('Updating transfers for change:', {
        type: changeType,
        // details: changeDetails
      });

      switch (changeType) {
        case 'HOTEL_CHANGE':
          return await this.updateTransfersForHotelChange({
            itinerary,
            cityName: changeDetails.cityName,
            date: changeDetails.date,
            newHotelDetails: changeDetails.newHotelDetails,
            inquiryToken
          });

        case 'FLIGHT_CHANGE':
          return await this.updateTransfersForFlightChange({
            itinerary,
            cityName: changeDetails.cityName,
            date: changeDetails.date,
            newFlight: changeDetails.newFlight,
            inquiryToken
          });

        default:
          throw new Error(`Unsupported change type: ${changeType}`);
      }

    } catch (error) {
      console.error('Error in updateTransfersForChange:', error);
      throw error;
    }
  }

  // Update transfers for flight change
  async updateTransfersForFlightChange(params) {
    const {
      itinerary,
      cityName,
      date,
      newFlight,
      inquiryToken
    } = params;

    try {
      const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
      if (cityIndex === -1) throw new Error('City not found');

      const dayIndex = itinerary.cities[cityIndex].days.findIndex(d => d.date === date);
      if (dayIndex === -1) throw new Error('Day not found');

      const day = itinerary.cities[cityIndex].days[dayIndex];
      const hotel = day.hotels[0];

      if (!hotel) {
        throw new Error('No hotel found for transfer update');
      }

      const updatedTransfers = [];

      if (cityIndex === 0) {
        // Update airport to first hotel transfer
        const airportTransfer = await this.processAirportToHotelTransfer({
          flight: newFlight,
          hotel,
          travelersDetails: itinerary.travelersDetails,
          inquiryToken,
          preferences: itinerary.preferences
        });
        if (airportTransfer) updatedTransfers.push(airportTransfer);
      }

      const isLastCity = cityIndex === itinerary.cities.length - 1;
      if (isLastCity) {
        // Update last hotel to airport transfer
        const airportTransfer = await this.processHotelToAirportTransfer({
          flight: newFlight,
          hotel,
          travelersDetails: itinerary.travelersDetails,
          inquiryToken,
          preferences: itinerary.preferences,
          date
        });
        if (airportTransfer) updatedTransfers.push(airportTransfer);
      }

      return updatedTransfers;

    } catch (error) {
      console.error('Error in updateTransfersForFlightChange:', error);
      throw error;
    }
  }
}

module.exports = new TransferOrchestrationService();