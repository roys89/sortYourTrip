/**
 * Calculate total flight duration from segments
 */
function calculateTotalDuration(flight) {
    if (!flight?.sg) return 0;
    return flight.sg.reduce((total, segment) => {
      return total + (segment.dr || 0) + (segment.gT || 0);
    }, 0);
  }
  
  /**
   * Format seat map from flight SSR data
   */
  function formatSeatMap(seatData) {
    if (!seatData || !Array.isArray(seatData)) return [];
    
    return seatData.map(segment => ({
      origin: segment.origin,
      destination: segment.destination,
      resultIdentifier: segment.resultIdentifier,
      rows: segment.rowSeats.map(row => ({
        seats: row.seats.map(seat => ({
          code: seat.code,
          seatNo: seat.seatNo,
          isBooked: seat.isBooked,
          price: seat.amt,
          description: seat.dsc,
          type: {
            isAisle: seat.isAisle,
            isWindow: seat.isWindow
          },
          priceBracket: seat.priceBracket
        }))
      }))
    }));
  }
  
  /**
   * Format meal options from flight SSR data
   */
  function formatMealOptions(mealData) {
    if (!mealData || !Array.isArray(mealData)) return [];
    
    return mealData.map(segment => ({
      origin: segment.origin,
      destination: segment.destination,
      resultIdentifier: segment.resultIdentifier,
      options: segment.options.map(meal => ({
        code: meal.code,
        price: meal.amt,
        description: meal.dsc
      }))
    }));
  }
  
  /**
   * Format baggage options from flight SSR data
   */
  function formatBaggageOptions(baggageData) {
    if (!baggageData || !Array.isArray(baggageData)) return [];
    
    return baggageData.map(segment => ({
      origin: segment.origin,
      destination: segment.destination,
      resultIdentifier: segment.resultIdentifier,
      options: segment.options.map(bag => ({
        code: bag.code,
        price: bag.amt,
        description: bag.dsc,
        weight: parseInt(bag.dsc.match(/\d+/)?.[0] || '0')
      }))
    }));
  }
  
/**
 * Format flight response from itinerary data
 */
function formatFlightResponse(itineraryData) {
    if (!itineraryData?.results?.itineraryItems?.[0]?.itemFlight) {
      console.log('Missing flight data in itinerary:', itineraryData);
      return null;
    }
  
    const flightItem = itineraryData.results.itineraryItems[0].itemFlight;
    
    // Get first and last segment
    const firstSegment = flightItem.segments[0][0];
    const lastSegment = flightItem.segments[0][flightItem.segments[0].length - 1];
  
    // Calculate total duration
    const totalDuration = flightItem.segments[0].reduce((total, segment) => {
      return total + (segment.dr || 0) + (segment.gT || 0); 
    }, 0);
  
    return {
      // Core flight details
      resultIndex: flightItem.resultIndex,
      transportationType: "flight",
      flightProvider: firstSegment.al.alN,
      flightCode: `${firstSegment.al.alC}${firstSegment.al.fN}`,
      
      // Route info
      origin: firstSegment.or.cN,
      destination: lastSegment.ds.cN,
  
      // Date and time info
      departureDate: firstSegment.or.dT.split('T')[0],
      departureTime: new Date(firstSegment.or.dT).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      landingTime: lastSegment.ds.aT, // Full ISO string
      arrivalTime: new Date(lastSegment.ds.aT).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
  
      // Duration and airline
      airline: firstSegment.al.alN,
      flightDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
  
      // Price info
      price: flightItem.fareQuote.finalFare,
  
      // Airport details (controller will enhance with location)
      originAirport: {
        name: firstSegment.or.aN,
        code: firstSegment.or.aC,
        city: firstSegment.or.cN,
        terminal: firstSegment.or.tr,
        location: {
          latitude: parseFloat(firstSegment.or.location?.latitude || 0),
          longitude: parseFloat(firstSegment.or.location?.longitude || 0)
        }
      },
      arrivalAirport: {
        name: lastSegment.ds.aN,
        code: lastSegment.ds.aC,
        city: lastSegment.ds.cN,
        terminal: lastSegment.ds.tr,
        location: {
          latitude: parseFloat(lastSegment.ds.location?.latitude || 0),
          longitude: parseFloat(lastSegment.ds.location?.longitude || 0)
        }
      },
  
      // Fare details
      fareDetails: {
        baseFare: flightItem.fareQuote.baseFare,
        taxAndSurcharge: flightItem.fareQuote.taxAndSurcharge,
        serviceFee: flightItem.fareQuote.serviceFee,
        finalFare: flightItem.fareQuote.finalFare,
        currency: flightItem.fareQuote.currency || 'INR',
        isRefundable: !flightItem.isRefundable,
        isLowCost: flightItem.isLCC
      },
  
      // Flight segments with detailed info
      segments: flightItem.segments[0].map(segment => ({
        baggage: segment.bg,
        cabinBaggage: segment.cBg,
        flightNumber: `${segment.al.alC}${segment.al.fN}`,
        origin: segment.or.cN,
        destination: segment.ds.cN,
        departureTime: segment.or.dT,
        arrivalTime: segment.ds.aT,
        duration: segment.dr,
        groundTime: segment.gT,
        airline: {
          code: segment.al.alC,
          name: segment.al.alN,
          operatingCarrier: segment.al.oC || segment.al.alN
        }
      })),
  
      // Additional services
      fareRules: flightItem.fareRule?.[0]?.fareRuleDetail || null,
      seatMap: formatSeatMap(flightItem.ssr?.seat) || null,
      mealOptions: formatMealOptions(flightItem.ssr?.meal) || null,
      baggageOptions: formatBaggageOptions(flightItem.ssr?.baggage) || null,

      //flahgs

      selectedSeats: null,
      selectedBaggage: null,
      selectedMeal: null,
      isSeatSelected: false,
      isBaggageSelected: false,
      isMealSelected: false,
  
      // Booking details
      bookingDetails: {
        itineraryCode: itineraryData.results.itineraryCode,
        pnr: flightItem.pnrDetails?.[0]?.pnr,
        isHoldAllowed: flightItem.isHoldAllowed,
        fareIdentifier: flightItem.fareIdentifier
      },
  
      // Metadata
      metadata: {
        provider: flightItem.provider,
        isLowCostCarrier: flightItem.isLCC,
        isDomestic: itineraryData.results.isDomestic
      }
    };
  }

  
  module.exports = {
    formatFlightResponse,
    formatSeatMap,
    formatMealOptions,
    formatBaggageOptions,
    calculateTotalDuration
  };