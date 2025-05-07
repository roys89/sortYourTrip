const ItineraryBooking = require('../models/ItineraryBooking');
const Itinerary = require('../models/Itinerary');
const Markup = require('../models/Markup'); // Assuming Markup model exists
const CancellationFee = require('../models/CancellationFee'); // Assuming CancellationFee model exists
const PolicyInterpreter = require('../utils/policyInterpreter'); // Assuming exists
const TransferCancellationDetailsService = require('../../shared/services/transferServicesLA/transferCancellationDetailsService'); // Assuming this exists
const moment = require('moment');

// --- Mock Service Imports ---
const HotelCancellationServiceTC = require('../../shared/services/hotelServicesTC/hotelCancellationServiceTC');
const FlightCancellationServiceTC = require('../../shared/services/flightServicesTC/flightCancellationServiceTC');
const ActivityCancellationServiceGRNC = require('../../shared/services/activityServicesGRNC/activityCancellationServiceGRNC');
const TransferCancellationServiceLA = require('../../shared/services/transferCancellationServiceLA');
const RefundService = require('../../shared/services/refundService');
const CrmService = require('../../shared/services/crmService');
// --- End Mock Service Imports ---

// Helper to safely get base price from different item structures
const getItemBasePrice = (item, type) => {
    try {
        switch(type.toLowerCase()) {
            case 'flight': return item.flightData?.price || 0;
            case 'hotel': return item.data?.totalAmount || 0; // Assuming this is base price before markup for hotel
            case 'activity': return item.packageDetails?.amount || 0;
            case 'transfer': return parseFloat(item.details?.selectedQuote?.quote?.fare || 0); 
            default: return 0;
        }
    } catch (e) {
        console.error(`Error getting base price for ${type}:`, e);
        return 0;
    }
};

// Helper function to apply the dynamic fee buffer
const applyFeeBuffer = (supplierPenalty, grossPrice, itemType, feeSettings) => {
    const setting = feeSettings.find(f => f.itemType.toLowerCase() === itemType.toLowerCase());
    let bufferFee = 0;

    if (setting) {
        if (setting.feeType === 'Percentage') {
            bufferFee = (grossPrice * setting.feeValue) / 100;
        } else if (setting.feeType === 'Fixed') {
            bufferFee = setting.feeValue;
        }
    }

    const totalUserPenalty = supplierPenalty + bufferFee;
    // Ensure total penalty doesn't exceed gross price
    const finalTotalUserPenalty = Math.max(0, Math.min(grossPrice, totalUserPenalty));
    const finalUserRefund = grossPrice - finalTotalUserPenalty;

    return {
        // Optionally return breakdown for transparency
        supplierPenalty: parseFloat(supplierPenalty.toFixed(2)), 
        bufferFee: parseFloat(bufferFee.toFixed(2)), 
        totalUserPenalty: parseFloat(finalTotalUserPenalty.toFixed(2)),
        userRefund: parseFloat(finalUserRefund.toFixed(2))
    };
};

// Main function to generate the cancellation quote
exports.generateQuote = async (bookingId, options) => {
    try {
        console.log(`[CancellationService] Generating quote for bookingId: ${bookingId}`);

        // 1. Fetch Booking & related Itinerary
        const booking = await ItineraryBooking.findOne({ bookingId });
        if (!booking) {
            throw new Error(`Booking with ID ${bookingId} not found.`);
        }

        const itinerary = await Itinerary.findOne({ itineraryToken: booking.itineraryToken });
        if (!itinerary) {
            throw new Error(`Itinerary with token ${booking.itineraryToken} not found for booking ${bookingId}.`);
        }

        // 2. Fetch Markups (Assuming a single markup doc or fetching logic)
        // This is a simplified fetch, adjust based on your actual markup storage
        const markupSettings = await Markup.findOne(); 
        if (!markupSettings) {
            console.warn("[CancellationService] Markup settings not found. Using 0% markup.");
            // Provide default markups if none found
             markupSettings = { markups: { flights: 0, hotels: 0, activities: 0, transfers: 0 } };
        }
        const markups = markupSettings.markups;

        // 3. Fetch Cancellation Fee Buffer Settings
        let feeSettings = [];
        try {
            feeSettings = await CancellationFee.find();
        } catch (feeError) {
            console.warn("[CancellationService] Could not fetch cancellation fee settings. Using 0 buffer.", feeError);
            // Optionally define default fees here if needed
        }

        const quoteItems = [];
        let totalEstimatedRefund = 0;

        // --- Iterate through Itinerary Items --- 
        for (const city of itinerary.cities) {
            for (const day of city.days) {
                // --- Process Flights ---
                for (const flight of day.flights || []) {
                    // Calculate common details first
                    const itemType = 'Flight';
                    const basePrice = getItemBasePrice(flight, itemType);
                    const markupPercent = markups.flights || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    const flightItineraryCode = flight.flightData?.bookingDetails?.itineraryCode;
                    const flightCode = flight.flightData?.flightCode;
                    const itemId = `flight-${flightItineraryCode || flightCode}`; // Use best available ID

                    // Check if this flight exists in the confirmed booking records
                    const isFlightBooked = booking.flights?.some(f => 
                        (flightItineraryCode && f.itineraryCode === flightItineraryCode) || 
                        (flightCode && f.flightCode === flightCode) // Fallback check
                    );

                    if (!isFlightBooked) {
                        // Item not booked - treat as fully refundable
                        console.log(`[CancellationServiceQuote] Flight (ID: ${itemId}) not found in booking records. Marking as free cancellation.`);
                        quoteItems.push({
                            itemId,
                            itemName: `${flight.flightData?.origin || 'N/A'}-${flight.flightData?.destination || 'N/A'} Flight`,
                            type: itemType,
                            grossPrice: parseFloat(grossPrice.toFixed(2)),
                            policySummary: "Not booked / Freely Cancellable",
                            userPenalty: 0,
                            userRefund: parseFloat(grossPrice.toFixed(2)),
                        });
                        totalEstimatedRefund += grossPrice;
                        continue; // Move to the next flight
                    }

                    // --- Flight is Booked - Proceed with normal policy check ---
                    // Combine date and time for policy check
                    const departureDate = flight.flightData?.departureDate;
                    const departureTime = flight.flightData?.departureTime;
                    let departureDateTimeISO = null;
                    if (departureDate && departureTime) {
                        const combinedDateTimeStr = `${departureDate} ${departureTime}`;
                        const departureMoment = moment(combinedDateTimeStr, "YYYY-MM-DD hh:mm A", true);
                        if (departureMoment.isValid()) {
                             departureDateTimeISO = departureMoment.toISOString();
                        } else {
                            console.warn(`[CancellationService] Could not parse combined date/time: ${combinedDateTimeStr} for flight ${itemId}`);
                        }
                    } else {
                         console.warn(`[CancellationService] Missing departure date or time for flight ${itemId}`);
                    }

                    const policyData = flight.flightData?.fareRules;
                    let policyRule = { type: 'error', message: 'Policy could not be determined' };
                    let policySummary = 'Policy could not be determined';

                    try {
                        if (departureDateTimeISO) {
                             policyRule = PolicyInterpreter.interpretFlightPolicy(policyData, departureDateTimeISO);
                             policySummary = PolicyInterpreter.summarizePolicy(policyRule, policyData);
                        } else {
                             policySummary = "Policy check unavailable due to missing or invalid departure date/time.";
                             policyRule = { type: 'error', message: 'Missing or invalid departure date/time' };
                        }
                    } catch (parseError) {
                        console.error(`Error parsing flight policy for ${itemId}:`, parseError);
                        policySummary = `Policy parsing error: ${parseError.message}. Raw: ${policyData?.substring(0, 100) || 'N/A'}`;
                        policyRule = { type: 'error', message: `Policy parsing error: ${parseError.message}` };
                    }

                    const supplierCalc = calculatePenaltyBasedOnRule(grossPrice, policyRule);
                    const finalCalc = applyFeeBuffer(supplierCalc.penalty, grossPrice, itemType, feeSettings);

                    quoteItems.push({
                        itemId,
                        itemName: `${flight.flightData?.origin || 'N/A'}-${flight.flightData?.destination || 'N/A'} Flight`,
                        type: itemType,
                        grossPrice: parseFloat(grossPrice.toFixed(2)),
                        policySummary: policySummary,
                        userPenalty: finalCalc.totalUserPenalty,
                        userRefund: finalCalc.userRefund,
                    });
                    totalEstimatedRefund += finalCalc.userRefund;
                }

                // --- Process Hotels ---
                for (const hotel of day.hotels || []) {
                     // Calculate common details first
                    const itemType = 'Hotel';
                    const basePrice = getItemBasePrice(hotel, itemType);
                    const markupPercent = markups.hotels !== undefined ? markups.hotels : 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    const hotelBookingRefId = hotel.data?.bookingDetails?.bookingRefId;
                    const hotelCode = hotel.data?.code; // Potential fallback identifier
                    const itemId = `hotel-${hotelBookingRefId || hotelCode || Date.now()}`; // Use best available ID

                    // Check if this hotel exists in the confirmed booking records
                    const isHotelBooked = booking.hotels?.some(h =>
                        (hotelBookingRefId && h.bookingRefId === hotelBookingRefId) ||
                        (hotelCode && h.code === hotelCode) // Corrected: Check against h.code
                     );

                     if (!isHotelBooked) {
                        // Item not booked - treat as fully refundable
                        console.log(`[CancellationServiceQuote] Hotel (ID: ${itemId}) not found in booking records. Marking as free cancellation.`);
                        quoteItems.push({
                            itemId,
                            itemName: `${hotel.data?.hotelDetails?.name || 'Hotel'} Stay`,
                            type: itemType,
                            grossPrice: parseFloat(grossPrice.toFixed(2)),
                            policySummary: "Not booked / Freely Cancellable",
                            userPenalty: 0,
                            userRefund: parseFloat(grossPrice.toFixed(2)),
                        });
                        totalEstimatedRefund += grossPrice;
                        continue; // Move to the next hotel
                     }

                    // --- Hotel is Booked - Proceed with normal policy check ---
                    let combinedPolicyRule = { type: 'free' };
                    let combinedPolicySummary = 'Policies may vary by room/rate.';
                    try {
                        const rates = hotel.data?.items?.[0]?.selectedRoomsAndRates;
                        if (!rates || !Array.isArray(rates) || rates.length === 0) {
                            throw new Error("No room rate details found for policy check.");
                        }
                        let strictestRule = { type: 'free', value: 0 };
                        let summaries = new Set();
                        for (const rate of rates) {
                            const policyData = rate.rate?.cancellationPolicies;
                            const checkInDate = hotel.data?.checkIn || hotel.data?.items?.[0]?.checkIn || day.date;
                            if (!policyData || !Array.isArray(policyData)) {
                                summaries.add("Policy missing for one or more rates.");
                                continue;
                            }
                            const rule = PolicyInterpreter.interpretHotelPolicy(policyData, checkInDate);
                            summaries.add(PolicyInterpreter.summarizePolicy(rule));
                            if (PolicyInterpreter.isRuleStricter(rule, strictestRule)) {
                                strictestRule = rule;
                            }
                        }
                        combinedPolicyRule = strictestRule;
                        if (summaries.size === 1) {
                            combinedPolicySummary = summaries.values().next().value;
                        } else if (summaries.size > 1) {
                            combinedPolicySummary = `Multiple policies apply. Strictest rule applied: ${PolicyInterpreter.summarizePolicy(strictestRule)}`;
                        } else {
                            combinedPolicySummary = "No applicable cancellation policies found for rooms.";
                            combinedPolicyRule = { type: 'free' };
                        }
                    } catch (parseError) {
                        console.error(`Error processing hotel policies for ${itemId}:`, parseError);
                        combinedPolicySummary = `Policy processing error: ${parseError.message}`;
                        combinedPolicyRule = { type: 'error', message: parseError.message };
                    }

                    const supplierCalc = calculatePenaltyBasedOnRule(grossPrice, combinedPolicyRule);
                    const finalCalc = applyFeeBuffer(supplierCalc.penalty, grossPrice, itemType, feeSettings);

                    quoteItems.push({
                        itemId,
                        itemName: `${hotel.data?.hotelDetails?.name || 'Hotel'} Stay`,
                        type: itemType,
                        grossPrice: parseFloat(grossPrice.toFixed(2)),
                        policySummary: combinedPolicySummary,
                        userPenalty: finalCalc.totalUserPenalty,
                        userRefund: finalCalc.userRefund,
                    });
                    totalEstimatedRefund += finalCalc.userRefund;
                }

                // --- Process Activities ---
                for (const activity of day.activities || []) {
                    // Calculate common details first
                    const itemType = 'Activity';
                    const basePrice = getItemBasePrice(activity, itemType);
                    const markupPercent = markups.activities || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    const activityBookingRef = activity.bookingDetails?.bookingReference;
                    const activityCode = activity.activityCode;
                    const itemId = `activity-${activityBookingRef || activityCode}`; // Use best available ID

                    // Check if this activity exists in the confirmed booking records
                    const isActivityBooked = booking.activities?.some(a =>
                        (activityBookingRef && a.bookingReference === activityBookingRef) ||
                        (activityCode && a.activityCode === activityCode)
                    );

                    if (!isActivityBooked) {
                         // Item not booked - treat as fully refundable
                        console.log(`[CancellationServiceQuote] Activity (ID: ${itemId}) not found in booking records. Marking as free cancellation.`);
                        quoteItems.push({
                            itemId,
                            itemName: activity.activityName || 'Activity',
                            type: itemType,
                            grossPrice: parseFloat(grossPrice.toFixed(2)),
                            policySummary: "Not booked / Freely Cancellable",
                            userPenalty: 0,
                            userRefund: parseFloat(grossPrice.toFixed(2)),
                        });
                        totalEstimatedRefund += grossPrice;
                        continue; // Move to the next activity
                    }

                    // --- Activity is Booked - Proceed with normal policy check ---
                    const policyData = activity.cancellationFromTourDate;
                    const tourDate = day.date;
                    let policyRule = { type: 'error', message: 'Policy could not be determined' };
                    let policySummary = 'Policy could not be determined';
                     try {
                        policyRule = PolicyInterpreter.interpretActivityPolicy(policyData, tourDate);
                        policySummary = PolicyInterpreter.summarizePolicy(policyRule);
                    } catch (parseError) {
                         console.error(`Error parsing activity policy for ${itemId}:`, parseError);
                         policySummary = `Policy processing error: ${parseError.message}`;
                         // Keep policyRule as error type if needed
                         policyRule = { type: 'error', message: `Policy parsing error: ${parseError.message}` };
                    }

                    const supplierCalc = calculatePenaltyBasedOnRule(grossPrice, policyRule);
                    const finalCalc = applyFeeBuffer(supplierCalc.penalty, grossPrice, itemType, feeSettings);

                    quoteItems.push({
                        itemId,
                        itemName: activity.activityName || 'Activity',
                        type: itemType,
                        grossPrice: parseFloat(grossPrice.toFixed(2)),
                        policySummary: policySummary,
                        userPenalty: finalCalc.totalUserPenalty,
                        userRefund: finalCalc.userRefund,
                    });
                    totalEstimatedRefund += finalCalc.userRefund;
                }

                // --- Process Transfers ---
                for (const transfer of day.transfers || []) {
                     // Calculate common details first
                    const itemType = 'Transfer';
                    const basePrice = getItemBasePrice(transfer, itemType);
                    const markupPercent = markups.transfers || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    const quotationId = transfer.details?.quotation_id;
                    // Try to find booking record
                    const bookedTransferData = booking.transfers?.find(t => t.quotationId === quotationId);
                    // Determine ID based on whether it was booked
                    const supplierRef = bookedTransferData?.booking_id;
                    const itemId = `transfer-${supplierRef || quotationId}`; // Use booking_id if available, else quotationId

                    if (!bookedTransferData) {
                         // Item not booked - treat as fully refundable
                        console.log(`[CancellationServiceQuote] Transfer (ID: ${itemId}) not found in booking records. Marking as free cancellation.`);
                        quoteItems.push({
                            itemId,
                            itemName: `Transfer: ${transfer.details?.origin?.city || 'Origin'} to ${transfer.details?.destination?.city || 'Dest'}`,
                            type: itemType,
                            grossPrice: parseFloat(grossPrice.toFixed(2)),
                            policySummary: "Not booked / Freely Cancellable",
                            userPenalty: 0,
                            userRefund: parseFloat(grossPrice.toFixed(2)),
                        });
                        totalEstimatedRefund += grossPrice;
                        continue; // Move to the next transfer
                    }

                    // --- Transfer is Booked - Proceed with normal policy check ---
                    let policyRule = { type: 'error', message: 'Policy needs live check' };
                    let policySummary = 'Requires live check';
                     try {
                        if (!supplierRef) {
                            throw new Error('Missing supplier reference (booking_id) even though booking record was found.');
                        }
                        console.log(`[CancellationService] Fetching Transfer details for ${itemId} (Ref: ${supplierRef})`);
                        const detailsResult = await TransferCancellationDetailsService.getProviderBookingDetails({ booking_id: supplierRef, inquiryToken: booking.inquiryToken });
                        if (!detailsResult.success || !detailsResult.data?.data) {
                            throw new Error(detailsResult.message || 'Failed to fetch transfer booking details.');
                        }
                        const providerBookingData = detailsResult.data.data;
                        policyRule = PolicyInterpreter.interpretAndCalculateTransferPolicy(providerBookingData);
                        policySummary = PolicyInterpreter.summarizePolicy(policyRule, providerBookingData);
                    } catch (fetchError) {
                        console.error(`Error fetching/processing transfer policy for ${itemId}:`, fetchError);
                        policySummary = `Policy fetch error: ${fetchError.message}. Assumed non-refundable.`;
                        policyRule = { type: 'non-refundable' };
                    }

                    const supplierCalc = calculatePenaltyBasedOnRule(grossPrice, policyRule);
                    const finalCalc = applyFeeBuffer(supplierCalc.penalty, grossPrice, itemType, feeSettings);

                    quoteItems.push({
                        itemId,
                        itemName: `Transfer: ${transfer.details?.origin?.city || 'Origin'} to ${transfer.details?.destination?.city || 'Dest'}`,
                        type: itemType,
                        grossPrice: parseFloat(grossPrice.toFixed(2)),
                        policySummary: policySummary,
                        userPenalty: finalCalc.totalUserPenalty,
                        userRefund: finalCalc.userRefund,
                    });
                    totalEstimatedRefund += finalCalc.userRefund;
                }
            }
        }
        // --- End Iteration --- 

        return {
            success: true,
            quote: {
                bookingId: bookingId,
                items: quoteItems,
                totalEstimatedRefund: parseFloat(totalEstimatedRefund.toFixed(2)),
            },
        };

    } catch (error) {
        console.error('[CancellationService] Error generating quote:', error);
        return {
            success: false,
            message: 'Failed to generate cancellation quote.',
            error: error.message,
        };
    }
};

// Helper function to calculate penalty based on rule and gross price
const calculatePenaltyBasedOnRule = (grossPrice, policyRule) => {
    let userPenalty = 0;

    switch (policyRule.type) {
        case 'percentage':
            userPenalty = (grossPrice * policyRule.value) / 100;
            break;
        case 'fixed':
            userPenalty = policyRule.value;
            break;
        case 'non-refundable':
            userPenalty = grossPrice;
            break;
        case 'free':
            userPenalty = 0;
            break;
        case 'error':
        default:
            console.warn(`Policy rule error or unhandled type: ${policyRule.type}. Assuming non-refundable.`);
            userPenalty = grossPrice; // Assume worst case (non-refundable) on error/unknown
            break;
    }

    // Ensure penalty doesn't exceed gross price and isn't negative
    userPenalty = Math.max(0, Math.min(grossPrice, userPenalty));
    const userRefund = grossPrice - userPenalty;

    return {
        penalty: parseFloat(userPenalty.toFixed(2)),
        userRefund: parseFloat(userRefund.toFixed(2))
    };
}

// Placeholder for cancellation execution service function (Phase 4 / 5)
exports.execute = async (bookingId, options) => {
    // TODO: Implement cancellation execution logic
    console.log(`[CancellationService] Executing cancellation for ${bookingId}`);
    // 1. Fetch Booking/Itinerary
    // 2. Iterate through confirmedItems
    // 3. Call Supplier Cancellation APIs
    // 4. Calculate final refund (based on ACTUAL net refunds? TBC)
    // 5. Call Razorpay Refund API (based on calculated User Refund)
    // 6. Update DB statuses
    // 7. Handle errors & escalations
    return { success: false, message: 'Execution not implemented' }; // Placeholder
};

// Main function to execute the cancellation
exports.executeCancellation = async (bookingId, itemsToCancel) => {
    console.log(`[CancellationService] Executing cancellation for bookingId: ${bookingId}`);
    const results = {
        success: true, // Assume overall success initially
        message: 'Cancellation processed.',
        itemResults: [],
        refundDetails: {
            totalUserPaid: 0,
            totalUserPenalty: 0,
            totalBufferFeeCharged: 0,
            totalSupplierRefundReceived: 0,
            finalUserRefundAmount: 0,
            refundStatus: 'Pending',
            refundId: null,
        },
        crmStatus: 'Not Logged',
        dbUpdateStatus: 'Pending',
    };

    let booking; // To store booking info
    let itinerary; // To store itinerary info
    let markupSettings; // To store markup settings
    let feeSettings; // To store buffer fee settings

    try {
        // 1. Fetch Booking, Itinerary, Markups, Fees (Similar to generateQuote)
        booking = await ItineraryBooking.findOne({ bookingId });
        if (!booking) {
            throw new Error(`Booking with ID ${bookingId} not found.`);
        }
        results.refundDetails.totalUserPaid = booking.totalPaid; // Store the total amount the user paid

        itinerary = await Itinerary.findOne({ itineraryToken: booking.itineraryToken });
        if (!itinerary) {
            throw new Error(`Itinerary with token ${booking.itineraryToken} not found.`);
        }

        markupSettings = await Markup.findOne(); // Assuming a single markup doc
        if (!markupSettings) {
            console.warn("[CancellationServiceExecute] Markup settings not found. Using 0% markup.");
            markupSettings = { markups: { flights: 0, hotels: 0, activities: 0, transfers: 0 } };
        }
        const markups = markupSettings.markups;

        feeSettings = await CancellationFee.find();

        let totalSupplierRefundReceived = 0;
        let totalCalculatedUserPenalty = 0;
        let totalCalculatedBufferFee = 0;
        let totalGrossPriceOfCancelledItems = 0; // Track original gross price of items being cancelled

        // 2. Process each item requested for cancellation
        for (const city of itinerary.cities) {
            for (const day of city.days) {
                // Process Flights
                for (const flight of day.flights || []) {
                    const supplierRef = flight.flightData?.bookingDetails?.itineraryCode || flight.flightData?.flightCode;
                    const itemId = `flight-${supplierRef}`; // Ensure consistent ID generation with quote

                    if (!itemsToCancel.includes(itemId)) continue; // Skip if not requested

                    const itemType = 'Flight';
                    const basePrice = getItemBasePrice(flight, itemType);
                    const markupPercent = markups.flights || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    totalGrossPriceOfCancelledItems += grossPrice; // Add to total being cancelled

                    console.log(`[CancellationServiceExecute] Processing ${itemType}: ${itemId} (Base: ${basePrice}, Gross: ${grossPrice})`);

                    let cancelResult = { success: false, message: 'Not processed', refundAmount: 0 };
                    try {
                        // --- Call Mock Supplier Cancellation API ---
                        cancelResult = await FlightCancellationServiceTC.cancelBooking(supplierRef, flight);

                        if (cancelResult.success) {
                            const supplierNetRefund = cancelResult.refundAmount;
                            const supplierPenalty = Math.max(0, basePrice - supplierNetRefund);

                            // Recalculate buffer fee based on actual gross price and settings
                            const bufferSetting = feeSettings.find(f => f.itemType.toLowerCase() === itemType.toLowerCase());
                            let bufferFee = 0;
                            if (bufferSetting) {
                                if (bufferSetting.feeType === 'Percentage') {
                                    bufferFee = (grossPrice * bufferSetting.feeValue) / 100;
                                } else {
                                    bufferFee = bufferSetting.feeValue;
                                }
                            }
                            bufferFee = Math.max(0, bufferFee);

                            // Calculate user penalty: (Supplier Penalty * Markup Rate) + Buffer Fee
                            const userPenalty = supplierPenalty * (1 + markupPercent / 100) + bufferFee;
                            const finalUserPenalty = Math.min(grossPrice, Math.max(0, userPenalty)); // Cap penalty at gross price
                            const finalUserRefundForItem = grossPrice - finalUserPenalty;

                            totalSupplierRefundReceived += supplierNetRefund;
                            totalCalculatedUserPenalty += finalUserPenalty;
                            totalCalculatedBufferFee += bufferFee;

                            results.itemResults.push({
                                itemId,
                                type: itemType,
                                success: true,
                                message: cancelResult.message || 'Cancelled successfully.',
                                supplierRefundReceived: parseFloat(supplierNetRefund.toFixed(2)),
                                userPenaltyCharged: parseFloat(finalUserPenalty.toFixed(2)),
                                bufferFeeCharged: parseFloat(bufferFee.toFixed(2)),
                                userRefundCalculated: parseFloat(finalUserRefundForItem.toFixed(2)),
                                originalGrossPrice: parseFloat(grossPrice.toFixed(2)) // Store for reference
                            });
                            flight.status = 'Cancelled'; // Mark item as cancelled in itinerary object
                            flight.cancellationDetails = { cancelledOn: new Date(), details: cancelResult.message };
                        } else {
                            results.itemResults.push({ itemId, type: itemType, success: false, message: cancelResult.message || 'Supplier cancellation failed.', originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            results.success = false; // Mark overall process as failed if any item fails
                            flight.status = 'Cancellation Failed';
                            flight.cancellationDetails = { failedOn: new Date(), error: cancelResult.message };
                        }
                    } catch (err) {
                        console.error(`[CancellationServiceExecute] Error cancelling ${itemType} ${itemId}:`, err);
                        results.itemResults.push({ itemId, type: itemType, success: false, message: `Internal error: ${err.message}`, originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                        results.success = false;
                        flight.status = 'Cancellation Failed';
                        flight.cancellationDetails = { failedOn: new Date(), error: `Internal error: ${err.message}` };
                    }
                }

                 // Process Hotels (Similar logic, call respective mock service)
                for (const hotel of day.hotels || []) {
                    const supplierRef = hotel.data?.bookingDetails?.bookingRefId || hotel.data?.code;
                    const itemId = `hotel-${supplierRef}`; // Ensure consistent ID
                    if (!itemsToCancel.includes(itemId)) continue;

                    const itemType = 'Hotel';
                    const basePrice = getItemBasePrice(hotel, itemType);
                    const markupPercent = markups.hotels || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    totalGrossPriceOfCancelledItems += grossPrice;

                    console.log(`[CancellationServiceExecute] Processing ${itemType}: ${itemId} (Base: ${basePrice}, Gross: ${grossPrice})`);

                    let cancelResult = { success: false, message: 'Not processed', refundAmount: 0 };
                    try {
                        cancelResult = await HotelCancellationServiceTC.cancelBooking(supplierRef, hotel);
                        if (cancelResult.success) {
                            const supplierNetRefund = cancelResult.refundAmount;
                            const supplierPenalty = Math.max(0, basePrice - supplierNetRefund);
                            const bufferSetting = feeSettings.find(f => f.itemType.toLowerCase() === itemType.toLowerCase());
                            let bufferFee = 0;
                            if (bufferSetting) bufferFee = bufferSetting.feeType === 'Percentage' ? (grossPrice * bufferSetting.feeValue) / 100 : bufferSetting.feeValue;
                            bufferFee = Math.max(0, bufferFee);
                            const userPenalty = supplierPenalty * (1 + markupPercent / 100) + bufferFee;
                            const finalUserPenalty = Math.min(grossPrice, Math.max(0, userPenalty));
                            const finalUserRefundForItem = grossPrice - finalUserPenalty;

                            totalSupplierRefundReceived += supplierNetRefund;
                            totalCalculatedUserPenalty += finalUserPenalty;
                            totalCalculatedBufferFee += bufferFee;

                            results.itemResults.push({ itemId, type: itemType, success: true, message: cancelResult.message || 'Cancelled successfully.', supplierRefundReceived: parseFloat(supplierNetRefund.toFixed(2)), userPenaltyCharged: parseFloat(finalUserPenalty.toFixed(2)), bufferFeeCharged: parseFloat(bufferFee.toFixed(2)), userRefundCalculated: parseFloat(finalUserRefundForItem.toFixed(2)), originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            hotel.status = 'Cancelled';
                            hotel.cancellationDetails = { cancelledOn: new Date(), details: cancelResult.message };
                        } else {
                            results.itemResults.push({ itemId, type: itemType, success: false, message: cancelResult.message || 'Supplier cancellation failed.', originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            results.success = false;
                            hotel.status = 'Cancellation Failed';
                            hotel.cancellationDetails = { failedOn: new Date(), error: cancelResult.message };
                        }
                    } catch (err) {
                        console.error(`[CancellationServiceExecute] Error cancelling ${itemType} ${itemId}:`, err);
                        results.itemResults.push({ itemId, type: itemType, success: false, message: `Internal error: ${err.message}`, originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                        results.success = false;
                        hotel.status = 'Cancellation Failed';
                        hotel.cancellationDetails = { failedOn: new Date(), error: `Internal error: ${err.message}` };
                    }
                }

                // Process Activities (Similar logic)
                for (const activity of day.activities || []) {
                    const supplierRef = activity.bookingDetails?.bookingReference || activity.activityCode;
                    const itemId = `activity-${supplierRef}`; // Ensure consistent ID
                    if (!itemsToCancel.includes(itemId)) continue;

                    const itemType = 'Activity';
                    const basePrice = getItemBasePrice(activity, itemType);
                    const markupPercent = markups.activities || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                     totalGrossPriceOfCancelledItems += grossPrice;

                    console.log(`[CancellationServiceExecute] Processing ${itemType}: ${itemId} (Base: ${basePrice}, Gross: ${grossPrice})`);

                    let cancelResult = { success: false, message: 'Not processed', refundAmount: 0 };
                    try {
                         cancelResult = await ActivityCancellationServiceGRNC.cancelBooking(supplierRef, activity);
                        if (cancelResult.success) {
                            const supplierNetRefund = cancelResult.refundAmount;
                            const supplierPenalty = Math.max(0, basePrice - supplierNetRefund);
                            const bufferSetting = feeSettings.find(f => f.itemType.toLowerCase() === itemType.toLowerCase());
                            let bufferFee = 0;
                            if (bufferSetting) bufferFee = bufferSetting.feeType === 'Percentage' ? (grossPrice * bufferSetting.feeValue) / 100 : bufferSetting.feeValue;
                            bufferFee = Math.max(0, bufferFee);
                            const userPenalty = supplierPenalty * (1 + markupPercent / 100) + bufferFee;
                            const finalUserPenalty = Math.min(grossPrice, Math.max(0, userPenalty));
                            const finalUserRefundForItem = grossPrice - finalUserPenalty;

                            totalSupplierRefundReceived += supplierNetRefund;
                            totalCalculatedUserPenalty += finalUserPenalty;
                            totalCalculatedBufferFee += bufferFee;

                            results.itemResults.push({ itemId, type: itemType, success: true, message: cancelResult.message || 'Cancelled successfully.', supplierRefundReceived: parseFloat(supplierNetRefund.toFixed(2)), userPenaltyCharged: parseFloat(finalUserPenalty.toFixed(2)), bufferFeeCharged: parseFloat(bufferFee.toFixed(2)), userRefundCalculated: parseFloat(finalUserRefundForItem.toFixed(2)), originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            activity.status = 'Cancelled';
                            activity.cancellationDetails = { cancelledOn: new Date(), details: cancelResult.message };
                        } else {
                            results.itemResults.push({ itemId, type: itemType, success: false, message: cancelResult.message || 'Supplier cancellation failed.', originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            results.success = false;
                            activity.status = 'Cancellation Failed';
                            activity.cancellationDetails = { failedOn: new Date(), error: cancelResult.message };
                        }
                    } catch (err) {
                        console.error(`[CancellationServiceExecute] Error cancelling ${itemType} ${itemId}:`, err);
                        results.itemResults.push({ itemId, type: itemType, success: false, message: `Internal error: ${err.message}`, originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                        results.success = false;
                        activity.status = 'Cancellation Failed';
                        activity.cancellationDetails = { failedOn: new Date(), error: `Internal error: ${err.message}` };
                    }
                }

                // Process Transfers (Similar logic)
                for (const transfer of day.transfers || []) {
                    const supplierRef = transfer.details?.supplierConfirmationNumber || transfer.details?.selectedQuote?.quote?.quoteId;
                    const itemId = `transfer-${supplierRef}`; // Ensure consistent ID
                    if (!itemsToCancel.includes(itemId)) continue;

                    const itemType = 'Transfer';
                    const basePrice = getItemBasePrice(transfer, itemType);
                    const markupPercent = markups.transfers || 0;
                    const grossPrice = basePrice * (1 + markupPercent / 100);
                    totalGrossPriceOfCancelledItems += grossPrice;

                    console.log(`[CancellationServiceExecute] Processing ${itemType}: ${itemId} (Base: ${basePrice}, Gross: ${grossPrice})`);

                     let cancelResult = { success: false, message: 'Not processed', refundAmount: 0 };
                    try {
                        // Note: Transfer cancellation often needs more specific data than just the ref
                        cancelResult = await TransferCancellationServiceLA.cancelBooking(supplierRef, transfer);
                        if (cancelResult.success) {
                             const supplierNetRefund = cancelResult.refundAmount;
                            const supplierPenalty = Math.max(0, basePrice - supplierNetRefund);
                            const bufferSetting = feeSettings.find(f => f.itemType.toLowerCase() === itemType.toLowerCase());
                            let bufferFee = 0;
                            if (bufferSetting) bufferFee = bufferSetting.feeType === 'Percentage' ? (grossPrice * bufferSetting.feeValue) / 100 : bufferSetting.feeValue;
                            bufferFee = Math.max(0, bufferFee);
                            const userPenalty = supplierPenalty * (1 + markupPercent / 100) + bufferFee;
                            const finalUserPenalty = Math.min(grossPrice, Math.max(0, userPenalty));
                            const finalUserRefundForItem = grossPrice - finalUserPenalty;

                            totalSupplierRefundReceived += supplierNetRefund;
                            totalCalculatedUserPenalty += finalUserPenalty;
                            totalCalculatedBufferFee += bufferFee;

                            results.itemResults.push({ itemId, type: itemType, success: true, message: cancelResult.message || 'Cancelled successfully.', supplierRefundReceived: parseFloat(supplierNetRefund.toFixed(2)), userPenaltyCharged: parseFloat(finalUserPenalty.toFixed(2)), bufferFeeCharged: parseFloat(bufferFee.toFixed(2)), userRefundCalculated: parseFloat(finalUserRefundForItem.toFixed(2)), originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            transfer.status = 'Cancelled';
                            transfer.cancellationDetails = { cancelledOn: new Date(), details: cancelResult.message };
                        } else {
                            results.itemResults.push({ itemId, type: itemType, success: false, message: cancelResult.message || 'Supplier cancellation failed.', originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                            results.success = false;
                            transfer.status = 'Cancellation Failed';
                            transfer.cancellationDetails = { failedOn: new Date(), error: cancelResult.message };
                        }
                    } catch (err) {
                        console.error(`[CancellationServiceExecute] Error cancelling ${itemType} ${itemId}:`, err);
                        results.itemResults.push({ itemId, type: itemType, success: false, message: `Internal error: ${err.message}`, originalGrossPrice: parseFloat(grossPrice.toFixed(2)) });
                        results.success = false;
                        transfer.status = 'Cancellation Failed';
                        transfer.cancellationDetails = { failedOn: new Date(), error: `Internal error: ${err.message}` };
                    }
                }
            }
        }

        // 3. Calculate Final User Refund Amount
        // The final refund amount is the sum of the 'userRefundCalculated' for successfully cancelled items.
        let calculatedFinalUserRefund = results.itemResults
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.userRefundCalculated, 0);

        // Sanity check: Ensure refund doesn't exceed the original gross price paid FOR THE CANCELLED ITEMS
        // This should be implicitly handled by the per-item cap, but acts as a safeguard.
        calculatedFinalUserRefund = Math.max(0, Math.min(totalGrossPriceOfCancelledItems, calculatedFinalUserRefund));

        results.refundDetails.totalSupplierRefundReceived = parseFloat(totalSupplierRefundReceived.toFixed(2));
        results.refundDetails.totalUserPenalty = parseFloat(totalCalculatedUserPenalty.toFixed(2));
        results.refundDetails.totalBufferFeeCharged = parseFloat(totalCalculatedBufferFee.toFixed(2));
        results.refundDetails.finalUserRefundAmount = parseFloat(calculatedFinalUserRefund.toFixed(2));

        // 4. Initiate Refund (e.g., Razorpay)
        if (results.refundDetails.finalUserRefundAmount > 0 && booking.paymentDetails?.razorpayPaymentId) {
            try {
                const refundNotes = {
                    bookingId: booking.bookingId,
                    reason: "User cancellation request",
                    itemsCancelled: results.itemResults.filter(r => r.success).map(r => r.itemId),
                    totalUserPenalty: results.refundDetails.totalUserPenalty,
                    bufferFee: results.refundDetails.totalBufferFeeCharged
                };
                console.log(`[CancellationServiceExecute] Initiating refund of ${results.refundDetails.finalUserRefundAmount} for payment ID ${booking.paymentDetails.razorpayPaymentId}`);
                const refundResult = await RefundService.initiateRefund(
                    booking.paymentDetails.razorpayPaymentId,
                    results.refundDetails.finalUserRefundAmount,
                    refundNotes
                );
                if (refundResult.success) {
                    results.refundDetails.refundStatus = 'Initiated';
                    results.refundDetails.refundId = refundResult.refundId;
                    results.message = "Cancellation processed, refund initiated.";
                    booking.refunds = [...(booking.refunds || []), { // Store refund details
                         refundId: refundResult.refundId,
                         amount: results.refundDetails.finalUserRefundAmount,
                         status: 'Initiated',
                         initiatedAt: new Date(),
                         items: results.itemResults.filter(r => r.success).map(r => r.itemId)
                    }];
                } else {
                    results.refundDetails.refundStatus = 'Failed';
                    results.success = false; // Overall failure if refund fails
                    results.message = `Cancellation processed, but refund initiation failed: ${refundResult.message}`;
                    console.error(`[CancellationServiceExecute] Refund initiation failed for booking ${bookingId}:`, refundResult.message);
                    // Log to CRM about refund failure
                    await CrmService.logCancellationEvent(bookingId, { level: 'ERROR', error: 'Refund Initiation Failed', details: refundResult.message, state: results.refundDetails });
                    results.crmStatus = 'Error Logged (Refund)';
                }
            } catch (refundError) {
                results.refundDetails.refundStatus = 'Failed';
                results.success = false;
                results.message = `Cancellation processed, but refund initiation encountered an error: ${refundError.message}`;
                console.error(`[CancellationServiceExecute] Error during refund initiation for booking ${bookingId}:`, refundError);
                 await CrmService.logCancellationEvent(bookingId, { level: 'ERROR', error: 'Refund Initiation Exception', details: refundError.message, state: results.refundDetails });
                 results.crmStatus = 'Error Logged (Refund Exception)';
            }
        } else if (results.refundDetails.finalUserRefundAmount <= 0) {
             results.refundDetails.refundStatus = 'Not Applicable (Zero Refund)';
             results.message = results.itemResults.some(r => r.success) ? "Cancellation processed, no refund applicable." : results.message; // Keep failure message if nothing succeeded
             if(results.itemResults.some(r => r.success)) { // If some items were cancelled successfully, but resulted in 0 refund
                 booking.refunds = [...(booking.refunds || []), {
                     refundId: null,
                     amount: 0,
                     status: 'Not Applicable',
                     initiatedAt: new Date(),
                     items: results.itemResults.filter(r => r.success).map(r => r.itemId)
                 }];
             }
        } else {
             results.refundDetails.refundStatus = 'Failed (Missing Payment ID)';
             results.success = false;
             results.message = "Cancellation processed, but cannot refund (missing payment ID).";
             console.error(`[CancellationServiceExecute] Cannot initiate refund for booking ${bookingId}: Missing Razorpay Payment ID.`);
             await CrmService.logCancellationEvent(bookingId, { level: 'ERROR', error: 'Refund Initiation Failed', details: 'Missing Razorpay Payment ID', state: results.refundDetails });
             results.crmStatus = 'Error Logged (Missing Payment ID)';
        }

        // 5. Update Database (Itinerary and Booking Status)
        try {
            // Mark itinerary as modified before saving
            itinerary.markModified('cities'); // Crucial for saving nested changes
            await itinerary.save();

            // Update booking status - Determine overall status
            // Check if *all* items originally in the itinerary are now 'Cancelled' or 'Cancellation Failed'
            let allItemsProcessedForCancellation = true;
            let anyItemsSuccessfullyCancelled = false;
            itinerary.cities.forEach(city => {
                city.days.forEach(day => {
                    [...(day.flights || []), ...(day.hotels || []), ...(day.activities || []), ...(day.transfers || [])].forEach(item => {
                         const supplierRef =
                             item.flightData?.bookingDetails?.itineraryCode || item.flightData?.flightCode ||
                             item.data?.bookingDetails?.bookingRefId || item.data?.code ||
                             item.bookingDetails?.bookingReference || item.activityCode ||
                             item.details?.supplierConfirmationNumber || item.details?.selectedQuote?.quote?.quoteId;
                        const itemId = `${itemTypeIdentifier(item)}-${supplierRef}`; // Need a robust way to get item type here

                        // Check if this item *was* requested for cancellation
                        const wasRequested = itemsToCancel.includes(itemId);
                        const isCancelled = item.status === 'Cancelled';
                        const isFailed = item.status === 'Cancellation Failed';

                        if (isCancelled) {
                            anyItemsSuccessfullyCancelled = true;
                        }
                        // If it was requested, it must end up as Cancelled or Failed
                        if (wasRequested && !(isCancelled || isFailed)) {
                           allItemsProcessedForCancellation = false; // Should not happen if logic above is correct
                           console.warn(`[CancellationServiceExecute] Item ${itemId} requested but status is ${item.status}`);
                        }
                         // If it *wasn't* requested, its status shouldn't have changed from the original 'Confirmed' (or similar active state)
                        // This check is complex as we don't store the original status easily here.
                        // A simpler check: Are *all* items that exist now either Cancelled or Failed? If yes, the whole booking is cancelled.
                        // A better check might be: Are all items that were requested for cancellation now in a final state (Cancelled/Failed)?

                    });
                });
            });

             // Determine final booking status more accurately
             const currentItemStatuses = new Set();
             itinerary.cities.forEach(city => city.days.forEach(day => {
                 [...(day.flights || []), ...(day.hotels || []), ...(day.activities || []), ...(day.transfers || [])].forEach(item => {
                     currentItemStatuses.add(item.status || 'Unknown'); // Add status of every item
                 });
             }));

            if (!currentItemStatuses.has('Confirmed') && !currentItemStatuses.has('Active') && !currentItemStatuses.has('Booked')) { // Add any other 'active' statuses
                 // If no items remain active/confirmed, the booking is fully Cancelled (even if some failed)
                 booking.bookingStatus = 'Cancelled';
            } else if (anyItemsSuccessfullyCancelled || currentItemStatuses.has('Cancellation Failed')) {
                 // If at least one item was successfully cancelled OR failed cancellation, it's partially cancelled
                 booking.bookingStatus = 'Partially Cancelled';
            }
            // Otherwise, the booking status remains as it was (e.g., 'Confirmed') if no cancellations happened or none succeeded/failed.

            booking.cancellationSummary = results; // Store the detailed results in the booking doc
            booking.updatedAt = new Date();
            booking.markModified('refunds'); // Mark refunds array as modified

            await booking.save();
            results.dbUpdateStatus = 'Success';

        } catch (dbError) {
            console.error(`[CancellationServiceExecute] Failed to update database for booking ${bookingId}:`, dbError);
            results.dbUpdateStatus = 'Failed';
            results.success = false; // Critical failure if DB update fails
            results.message += " | CRITICAL: Database update failed after processing.";
             // Log severe error to CRM
             if (results.crmStatus !== 'Error Logged (Refund)' && results.crmStatus !== 'Error Logged (Refund Exception)' && results.crmStatus !== 'Error Logged (Missing Payment ID)') { // Avoid over-logging if refund already failed
                await CrmService.logCancellationEvent(bookingId, { level: 'CRITICAL', error: 'DB Update Failed', details: dbError.message, state: results });
                results.crmStatus = 'CRITICAL Logged (DB)';
             }
        }

        // 6. Log to CRM (Standard log or Failure/Escalation, avoid double logging)
        if (!results.crmStatus.includes('Logged')) { // Log only if not already logged due to specific errors
             try {
                 const crmPayload = {
                    level: results.success ? 'INFO' : 'ERROR',
                    message: results.message,
                    itemResults: results.itemResults,
                    refundDetails: results.refundDetails,
                    finalBookingStatus: booking.bookingStatus // Add final status
                 };
                const crmResult = await CrmService.logCancellationEvent(bookingId, crmPayload);
                results.crmStatus = crmResult.success ? 'Logged Successfully' : 'Logging Failed';
             } catch (crmError) {
                 console.error(`[CancellationServiceExecute] Error logging to CRM for booking ${bookingId}:`, crmError);
                 results.crmStatus = 'Logging Error';
             }
        }

    } catch (error) {
        console.error(`[CancellationServiceExecute] Unhandled error during cancellation for booking ${bookingId}:`, error);
        results.success = false;
        results.message = `Cancellation failed due to an unhandled error: ${error.message}`;
        // Attempt to log critical failure to CRM if possible
        if (!results.crmStatus.includes('Logged')) {
            try {
                 await CrmService.logCancellationEvent(bookingId, { level: 'FATAL', error: 'Unhandled Exception', details: error.message });
                 results.crmStatus = 'FATAL Logged';
            } catch { results.crmStatus = 'FATAL Logging Failed'; }
        }
    }

    console.log(`[CancellationService] Execution complete for bookingId: ${bookingId}. Final Status:`, results.success ? 'Success' : 'Failed');
    return results;
};

// Helper function to identify item type (basic version)
const itemTypeIdentifier = (item) => {
    if (item.flightData) return 'flight';
    if (item.data?.hotelDetails) return 'hotel'; // Check for a hotel-specific field
    if (item.activityCode) return 'activity'; // Check for activity-specific field
    if (item.details?.selectedQuote?.quote?.vehicle) return 'transfer'; // Check for transfer-specific field
    return 'unknown';
};


// Helper function to find an itinerary item by its generated ID (needs refinement)
// NOTE: This helper might be less critical now as we calculate/store gross price per item within the loop.
// Keeping it in case it's needed for other lookups.
const findItineraryItem = (itinerary, itemId) => {
    const [type, ...refParts] = itemId.split('-');
    const ref = refParts.join('-'); // Reconstruct ref if it contained dashes

    for (const city of itinerary.cities) {
        for (const day of city.days) {
            const collections = [
                { items: day.flights, type: 'flight' },
                { items: day.hotels, type: 'hotel' },
                { items: day.activities, type: 'activity' },
                { items: day.transfers, type: 'transfer' }
            ];
            for (const collectionInfo of collections) {
                 if (collectionInfo.items && collectionInfo.type === type) {
                    for (const item of collectionInfo.items) {
                         let itemRef;
                         switch(type) {
                             case 'flight':
                                 itemRef = item.flightData?.bookingDetails?.itineraryCode || item.flightData?.flightCode;
                                 break;
                             case 'hotel':
                                 itemRef = item.data?.bookingDetails?.bookingRefId || item.data?.code;
                                 break;
                             case 'activity':
                                 itemRef = item.bookingDetails?.bookingReference || item.activityCode;
                                 break;
                             case 'transfer':
                                 itemRef = item.details?.supplierConfirmationNumber || item.details?.selectedQuote?.quote?.quoteId;
                                 break;
                         }

                        if (itemRef === ref) {
                            // Found the item, return it along with its identified type
                            return { data: item, type: collectionInfo.type };
                        }
                    }
                }
            }
        }
    }
    console.warn(`[findItineraryItem] Item not found for ID: ${itemId}`);
    return null; // Item not found
}; 