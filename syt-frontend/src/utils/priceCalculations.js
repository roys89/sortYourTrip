// utils/priceCalculations.js

const calculateFlightAddons = (flightData) => {
  let totalAddons = 0;
  
  if (flightData.isSeatSelected && flightData.selectedSeats) {
    totalAddons += flightData.selectedSeats.reduce((seatTotal, segment) => {
      const segmentTotal = segment.rows.reduce((rowTotal, row) => {
        return rowTotal + row.seats.reduce((total, seat) => total + (seat.price || 0), 0);
      }, 0);
      return seatTotal + segmentTotal;
    }, 0);
  }

  if (flightData.isBaggageSelected && flightData.selectedBaggage) {
    totalAddons += flightData.selectedBaggage.reduce((baggageTotal, segment) => {
      return baggageTotal + segment.options.reduce((total, option) => {
        return total + (option.price || 0);
      }, 0);
    }, 0);
  }

  if (flightData.isMealSelected && flightData.selectedMeal) {
    totalAddons += flightData.selectedMeal.reduce((mealTotal, segment) => {
      return mealTotal + segment.options.reduce((total, option) => {
        return total + (option.price || 0);
      }, 0);
    }, 0);
  }

  return Number(totalAddons.toFixed(2));
};

const getBasePrice = (item) => {
  let price = 0;
  if (item.price) {
    price = item.price;
  } else if (item.packageDetails?.amount) {
    price = item.packageDetails.amount;
  } else if (item.data?.totalAmount) {
    price = item.data.totalAmount;
  } else if (item.flightData) {
    price = item.flightData.price || 0;
    price += calculateFlightAddons(item.flightData);
  } else if (item.details?.selectedQuote?.quote?.fare) {
    price = parseFloat(item.details.selectedQuote.quote?.fare);
  }
  return Number(price.toFixed(2));
};

export const calculateSegmentTotal = (items, markup) => {
  return Number(items.reduce((total, item) => {
    const itemPrice = getBasePrice(item);
    const markupAmount = Number((itemPrice * markup / 100).toFixed(2));
    return Number((total + itemPrice + markupAmount).toFixed(2));
  }, 0));
};

export const calculateBaseTotal = (items) => {
  return Number(items.reduce((total, item) => {
    return Number((total + getBasePrice(item)).toFixed(2));
  }, 0));
};

const calculateTieredTCS = (baseTotal, tcsRates) => {
  const { default: defaultRate, highValue: highValueRate, threshold } = tcsRates;
  
  if (baseTotal <= threshold) {
    const tcsAmount = Number((baseTotal * defaultRate / 100).toFixed(2));
    return {
      tcsAmount,
      effectiveRate: Number(defaultRate.toFixed(2))
    };
  } else {
    const defaultTCS = Number((threshold * defaultRate / 100).toFixed(2));
    const highValueAmount = Number((baseTotal - threshold).toFixed(2));
    const highValueTCS = Number((highValueAmount * highValueRate / 100).toFixed(2));
    
    const totalTCS = Number((defaultTCS + highValueTCS).toFixed(2));
    const effectiveRate = Number(((totalTCS / baseTotal) * 100).toFixed(2));
    
    return {
      tcsAmount: totalTCS,
      effectiveRate
    };
  }
};

export const calculateItineraryTotal = (itinerary, markups, tcsRates) => {
  let segmentBaseTotals = {
    activities: 0,
    hotels: 0,
    flights: 0,
    transfers: 0
  };

  // Iterate through all cities and days
  itinerary.cities.forEach(city => {
    city.days.forEach(day => {
      // Calculate base total for each segment
      Object.keys(segmentBaseTotals).forEach(segment => {
        if (day[segment]) {
          // Use calculateBaseTotal for each segment
          segmentBaseTotals[segment] = Number(
            (segmentBaseTotals[segment] + calculateBaseTotal(day[segment])).toFixed(2)
          );
        }
      });
    });
  });

  // Calculate base total across all segments
  const baseTotal = Number(
    Object.values(segmentBaseTotals).reduce(
      (a, b) => Number((a + b).toFixed(2)), 
      0
    )
  );

  // Calculate TCS
  const { tcsAmount, effectiveRate } = calculateTieredTCS(baseTotal, tcsRates);

  // Calculate segment totals with markups
  const segmentTotals = {};
  Object.keys(segmentBaseTotals).forEach(segment => {
    const baseAmount = segmentBaseTotals[segment];
    const markupAmount = Number((baseAmount * markups[segment] / 100).toFixed(2));
    segmentTotals[segment] = Number((baseAmount + markupAmount).toFixed(2));
  });

  // Calculate subtotal and grand total
  const subtotal = Number(
    Object.values(segmentTotals).reduce(
      (a, b) => Number((a + b).toFixed(2)), 
      0
    )
  );

  return {
    segmentTotals,     // Totals for each segment with markup
    baseTotal,         // Total before markup
    subtotal,          // Total after markup
    tcsRate: Number(effectiveRate.toFixed(2)),
    tcsAmount: Number(tcsAmount.toFixed(2)),
    grandTotal: Number((subtotal + tcsAmount).toFixed(2)),
    // Include segment base totals for debugging
    segmentBaseTotals
  };
};

// New addition: Update itinerary object with rechecked prices
export const updateItineraryPrices = (itinerary, flightResults, hotelResults) => {
  const updatedItinerary = JSON.parse(JSON.stringify(itinerary));

  updatedItinerary.cities.forEach(city => {
    city.days.forEach(day => {
      // Update flight prices
      if (day.flights?.length) {
        day.flights.forEach(flight => {
          const flightCheck = flightResults?.data?.details?.find(
            result => result.traceId === flight.flightData.traceId
          );
          
          if (flightCheck?.isPriceChanged) {
            flight.flightData.price = flightCheck.totalAmount;
            if (flight.flightData.fareDetails) {
              flight.flightData.fareDetails.finalFare = flightCheck.totalAmount;
              flight.flightData.fareDetails.baseFare = flightCheck.details.baseFare;
              flight.flightData.fareDetails.taxAndSurcharge = flightCheck.details.taxAndSurcharge;
            }
          }
        });
      }

      // Update hotel prices  
      if (day.hotels?.length) {
        day.hotels.forEach(hotel => {
          const hotelCheck = hotelResults?.data?.details?.find(
            result => result.traceId === hotel.data.traceId
          );

          if (hotelCheck?.priceChangeData?.isPriceChanged) {
            hotel.data.totalAmount = hotelCheck.priceChangeData.currentTotalAmount;
            
            if (hotel.data.items?.[0]?.selectedRoomsAndRates?.[0]?.rate) {
              const rate = hotel.data.items[0].selectedRoomsAndRates[0].rate;
              rate.finalRate = hotelCheck.priceChangeData.currentTotalAmount;
            }
          }
        });
      }
    });
  });

  return updatedItinerary;
};


// New addition: Calculate price differences
export const getPriceCheckSummary = (
  itinerary, 
  flightResults, 
  hotelResults, 
  markups, 
  tcsRates
) => {
  try {
    // Ensure existing price totals are used as fallback
    const originalTotals = calculateItineraryTotal(
      itinerary, 
      markups, 
      tcsRates
    );
    
    // If no results, return original totals
    if (!flightResults || !hotelResults) {
      return {
        originalTotals,
        newTotals: originalTotals,
        difference: 0,
        percentageChange: 0,
        hasPriceChanged: false
      };
    }
    
    // Update prices in itinerary
    const updatedItinerary = updateItineraryPrices(
      itinerary, 
      flightResults, 
      hotelResults
    );
    
    // Calculate new totals
    const newTotals = calculateItineraryTotal(
      updatedItinerary, 
      markups, 
      tcsRates
    );
    
    // Calculate differences
    const difference = Number(
      (newTotals.grandTotal - originalTotals.grandTotal).toFixed(2)
    );
    const percentageChange = Number(
      ((difference / originalTotals.grandTotal) * 100).toFixed(2)
    );

    console.log('Price Check Debug:', {
      originalTotals,
      newTotals,
      segmentBaseTotals: {
        original: originalTotals.segmentBaseTotals,
        new: newTotals.segmentBaseTotals
      }
    });

    return {
      originalTotals,
      newTotals,
      difference,
      percentageChange,
      hasPriceChanged: difference !== 0,
      updatedItinerary
    };
  } catch (error) {
    console.error('Error in getPriceCheckSummary:', error);
    return {
      originalTotals: null,
      newTotals: null,
      difference: 0,
      percentageChange: 0,
      hasPriceChanged: false
    };
  }
};