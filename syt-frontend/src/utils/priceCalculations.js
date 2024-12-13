// utils/priceCalculations.js
export const calculateSegmentTotal = (items, markup) => {
  return items.reduce((total, item) => {
    let itemPrice = 0;
    
    // Handle different price structures
    if (item.price) {
      itemPrice = item.price;
    } else if (item.packageDetails?.amount) {
      itemPrice = item.packageDetails.amount;
    } else if (item.rate?.price) {
      itemPrice = item.rate.price;
    } else if (item.flightData?.price) {
      itemPrice = item.flightData.price;
    } else if (item.details?.selectedQuote?.fare) {
      itemPrice = parseFloat(item.details.selectedQuote.fare);
    }

    const markupAmount = (itemPrice * markup) / 100;
    return total + itemPrice + markupAmount;
  }, 0);
};

export const calculateItineraryTotal = (itinerary, markups, tcsRates) => {
  let segmentTotals = {
    activities: 0,
    hotels: 0,
    flights: 0,
    transfers: 0
  };

  // Calculate totals for each city
  itinerary.cities.forEach(city => {
    city.days.forEach(day => {
      segmentTotals.activities += calculateSegmentTotal(day.activities, markups.activities);
      segmentTotals.hotels += calculateSegmentTotal(day.hotels, markups.hotels);
      segmentTotals.flights += calculateSegmentTotal(day.flights, markups.flights);
      segmentTotals.transfers += calculateSegmentTotal(day.transfers, markups.transfers);
    });
  });

  const subtotal = Object.values(segmentTotals).reduce((a, b) => a + b, 0);
  const tcsRate = subtotal > tcsRates.threshold ? tcsRates.highValue : tcsRates.default;
  const tcsAmount = (subtotal * tcsRate) / 100;

  return {
    segmentTotals,
    subtotal,
    tcsRate,
    tcsAmount,
    grandTotal: subtotal + tcsAmount
  };
};