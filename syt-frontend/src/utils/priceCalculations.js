// utils/priceCalculations.js

// Helper to get base price without markup and round to 2 decimals
const getBasePrice = (item) => {
  let price = 0;
  if (item.price) {
    price = item.price;
  } else if (item.packageDetails?.amount) {
    price = item.packageDetails.amount;
  } else if (item.data?.totalAmount) {
    price = item.data.totalAmount;
  } else if (item.flightData?.price) {
    price = item.flightData.price;
  } else if (item.details?.selectedQuote?.quote?.fare) {
    price = parseFloat(item.details.selectedQuote.quote?.fare);
  }
  return Number(price.toFixed(2));
};

// Calculate total for a segment including markup
export const calculateSegmentTotal = (items, markup) => {
  return Number(items.reduce((total, item) => {
    const itemPrice = getBasePrice(item);
    const markupAmount = Number((itemPrice * markup / 100).toFixed(2));
    return Number((total + itemPrice + markupAmount).toFixed(2));
  }, 0));
};

// Calculate total base price without markup
export const calculateBaseTotal = (items) => {
  return Number(items.reduce((total, item) => {
    return Number((total + getBasePrice(item)).toFixed(2));
  }, 0));
};

// Calculate TCS based on tiered rates
const calculateTieredTCS = (baseTotal, tcsRates) => {
  const { default: defaultRate, highValue: highValueRate, threshold } = tcsRates;
  
  if (baseTotal <= threshold) {
    // If base total is under threshold, apply default rate to entire amount
    const tcsAmount = Number((baseTotal * defaultRate / 100).toFixed(2));
    return {
      tcsAmount,
      effectiveRate: Number(defaultRate.toFixed(2))
    };
  } else {
    // For amount over threshold, apply different rates
    const defaultTCS = Number((threshold * defaultRate / 100).toFixed(2));
    const highValueAmount = Number((baseTotal - threshold).toFixed(2));
    const highValueTCS = Number((highValueAmount * highValueRate / 100).toFixed(2));
    
    const totalTCS = Number((defaultTCS + highValueTCS).toFixed(2));
    // Calculate effective rate for display
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

  // Calculate base totals without markup
  itinerary.cities.forEach(city => {
    city.days.forEach(day => {
      Object.keys(segmentBaseTotals).forEach(segment => {
        if (day[segment]) {
          segmentBaseTotals[segment] = Number((segmentBaseTotals[segment] + calculateBaseTotal(day[segment])).toFixed(2));
        }
      });
    });
  });

  // Calculate total before markup
  const baseTotal = Number(Object.values(segmentBaseTotals).reduce((a, b) => Number((a + b).toFixed(2)), 0));

  // Calculate TCS using tiered approach
  const { tcsAmount, effectiveRate } = calculateTieredTCS(baseTotal, tcsRates);

  // Calculate segment totals with markup
  const segmentTotals = {};
  Object.keys(segmentBaseTotals).forEach(segment => {
    const baseAmount = segmentBaseTotals[segment];
    const markupAmount = Number((baseAmount * markups[segment] / 100).toFixed(2));
    segmentTotals[segment] = Number((baseAmount + markupAmount).toFixed(2));
  });

  const subtotal = Number(Object.values(segmentTotals).reduce((a, b) => Number((a + b).toFixed(2)), 0));

  return {
    segmentTotals,
    baseTotal: Number(baseTotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    tcsRate: Number(effectiveRate.toFixed(2)),
    tcsAmount: Number(tcsAmount.toFixed(2)),
    grandTotal: Number((subtotal + tcsAmount).toFixed(2))
  };
};