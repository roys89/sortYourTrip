const moment = require('moment-timezone'); // Using moment for robust date/time handling

/**
 * Interprets flight cancellation policy text.
 * Attempts to find the most applicable rule based on time windows.
 * 
 * @param {string} policyText - The raw fare rules text.
 * @param {string | Date} departureTimeISO - The departure time of the flight (ISO string preferred).
 * @returns {object} Standardized policy rule object.
 */
exports.interpretFlightPolicy = (policyText, departureTimeISO) => {
    console.log("[PolicyInterpreter] Interpreting Flight Policy...");
    if (!policyText || typeof policyText !== 'string') return { type: 'error', message: 'No valid policy text provided' };

    try {
        const now = moment();
        const departureMoment = moment(departureTimeISO);
        if (!departureMoment.isValid()) {
            return { type: 'error', message: 'Invalid departure time provided for policy check.' };
        }
        const hoursBeforeDeparture = departureMoment.diff(now, 'hours', true); // Use float for more precision

        // --- Enhanced Regex Patterns --- 
        // Non-refundable within X hours/days
        const nonRefundableWindowRegex = /(?:non-refundable|no refund|not allowed|100% charge).*(?:within|less than|after) *(\d+) *(hours?|days?)(?: *of| *before)? departure/gi;
        // Fee (fixed/percentage) within X hours/days
        const feeWindowRegex = /(?:charge of|fee of|penalty of) *(?:(?:INR|USD|EUR|₹) *(\d+(?:\.\d+)?)|(\d+) *(?:%|percent)).*(?:within|less than|after) *(\d+) *(hours?|days?)(?: *of| *before)? departure/gi;
        // Fee (fixed/percentage) BETWEEN A and B hours/days (More complex, capture both windows and fee)
        const feeBetweenWindowRegex = /(?:charge of|fee of|penalty of) *(?:(?:INR|USD|EUR|₹) *(\d+(?:\.\d+)?)|(\d+) *(?:%|percent)).* between *(\d+) *and *(\d+) *(hours?|days?)(?: *of| *before)? departure/gi;
        // Free cancellation UNTIL X hours/days
        const freeWindowRegex = /(?:free cancellation|no charge|0% charge).*(?:up to|until|before) *(\d+) *(hours?|days?)(?: *of| *before)? departure/gi;
        // General non-refundable statement (no window specified)
        const generalNonRefundableRegex = /(?:\bnon-refundable\b|\bnon refundable\b|\bno refund\b|\bcancellation +(?:not +available|not +permitted|is +unavailable)\b)(?!.*(?:within|less than|after|between|up to|until|before) *\d+ *(?:hours?|days?))/i;
        // General fixed/percentage fee (no window specified)
        const generalFixedFeeRegex = /(?:charge of|fee of|penalty of) *(?:INR|USD|EUR|₹) *(\d+(?:\.\d+)?)(?!.*(?:within|less than|after|between|up to|until|before) *\d+ *(?:hours?|days?))/i;
        const generalPercentageFeeRegex = /(?:charge of|fee of|penalty of) *(\d+) *(?:%|percent)(?!.*(?:within|less than|after|between|up to|until|before) *\d+ *(?:hours?|days?))/i;
        // --- End Regex Patterns ---

        let applicableRules = [];

        // Helper to convert window (value + unit) to hours
        const getWindowHours = (value, unit) => {
            const num = parseInt(value);
            if (unit.toLowerCase().startsWith('day')) return num * 24;
            return num; // Assume hours otherwise
        };

        // 1. Find all specific rules with time windows
        let match;
        // Non-refundable windows
        while ((match = nonRefundableWindowRegex.exec(policyText)) !== null) {
            const limitHours = getWindowHours(match[1], match[2]);
            applicableRules.push({ type: 'non-refundable', condition: 'within', limitHours, priority: 1 }); 
        }
        // Fee windows (within)
        while ((match = feeWindowRegex.exec(policyText)) !== null) {
            const limitHours = getWindowHours(match[3], match[4]);
            const fixedFee = match[1] ? parseFloat(match[1]) : null;
            const percentFee = match[2] ? parseInt(match[2]) : null;
            if (fixedFee !== null) {
                 applicableRules.push({ type: 'fixed', value: fixedFee, condition: 'within', limitHours, priority: 2 });
            } else if (percentFee !== null) {
                applicableRules.push({ type: 'percentage', value: percentFee, condition: 'within', limitHours, priority: 2 });
            }
        }
        // Fee windows (between)
        while ((match = feeBetweenWindowRegex.exec(policyText)) !== null) {
            const startHours = getWindowHours(match[3], match[5]); // Lower bound of range
            const endHours = getWindowHours(match[4], match[5]); // Upper bound of range
            const fixedFee = match[1] ? parseFloat(match[1]) : null;
            const percentFee = match[2] ? parseInt(match[2]) : null;
            const minHours = Math.min(startHours, endHours);
            const maxHours = Math.max(startHours, endHours);
             if (fixedFee !== null) {
                 applicableRules.push({ type: 'fixed', value: fixedFee, condition: 'between', minHours, maxHours, priority: 3 });
            } else if (percentFee !== null) {
                applicableRules.push({ type: 'percentage', value: percentFee, condition: 'between', minHours, maxHours, priority: 3 });
            }
        }
        // Free windows (until)
         while ((match = freeWindowRegex.exec(policyText)) !== null) {
            const limitHours = getWindowHours(match[1], match[2]);
            applicableRules.push({ type: 'free', condition: 'until', limitHours, priority: 4 });
        }
        
        // --- Filter rules applicable NOW based on hoursBeforeDeparture ---
        let activeRule = null; 
        let highestPriority = 99; // Lower number = higher priority

        for (const rule of applicableRules) {
            let isActive = false;
            switch (rule.condition) {
                case 'within': // Non-refundable or Fee applies if cancelling *inside* this window (closer to departure)
                    if (hoursBeforeDeparture < rule.limitHours) isActive = true;
                    break;
                case 'between': // Fee applies if cancelling *between* these times
                     if (hoursBeforeDeparture >= rule.minHours && hoursBeforeDeparture < rule.maxHours) isActive = true;
                    break;
                case 'until': // Free applies if cancelling *before* this time (further from departure)
                     if (hoursBeforeDeparture >= rule.limitHours) isActive = true;
                    break;
            }

            if (isActive) {
                // If this rule is active and has higher or equal priority than the current best,
                // consider it. If equal priority, potentially take the stricter one (e.g., higher fee).
                 if (rule.priority < highestPriority) {
                     activeRule = { type: rule.type, value: rule.value }; // Copy relevant fields
                     highestPriority = rule.priority;
                 } else if (rule.priority === highestPriority && activeRule) {
                     // If same priority (e.g., multiple fees apply now - unlikely but possible),
                     // decide based on strictness (non-refundable > percentage > fixed > free)
                     // Use isRuleStricter helper function
                     const potentialNewRule = { type: rule.type, value: rule.value };
                     if (exports.isRuleStricter(potentialNewRule, activeRule)) {
                          activeRule = potentialNewRule;
                     }                     
                 }
            }
        }

        // --- Apply General Rules if no specific window matched ----
        if (activeRule === null) {
            console.log("[PolicyInterpreter] No specific time window rule applied. Checking general rules...");
            // Check in order of strictness
            if (generalNonRefundableRegex.test(policyText)) {
                activeRule = { type: 'non-refundable' };
            } else {
                 const fixedMatch = policyText.match(generalFixedFeeRegex);
                 const percentMatch = policyText.match(generalPercentageFeeRegex);
                 if (fixedMatch && fixedMatch[1]) {
                    activeRule = { type: 'fixed', value: parseFloat(fixedMatch[1]) };
                 } else if (percentMatch && percentMatch[1]) {
                     activeRule = { type: 'percentage', value: parseInt(percentMatch[1]) };
                 }
                 // Assuming general 'free' text without a window is less common/reliable
            }
        }

        // --- Final Fallback --- 
        if (activeRule === null) {
            console.warn("[PolicyInterpreter] Could not determine applicable flight rule.", policyText.substring(0, 300));
            // Fallback to error, or optionally non-refundable depending on business risk tolerance
            activeRule = { type: 'error', message: 'Could not determine applicable cancellation rule.' };
        }
        
        // Clean up rule value if type is free/non-refundable/error
        if (['free', 'non-refundable', 'error'].includes(activeRule.type)) {
            delete activeRule.value;
        }

        console.log(`[PolicyInterpreter] Determined flight rule: ${JSON.stringify(activeRule)} for ${hoursBeforeDeparture.toFixed(2)} hours before departure.`);
        return activeRule;

    } catch (error) {
         console.error("[PolicyInterpreter] Error during flight policy interpretation:", error);
         return { type: 'error', message: `Error interpreting flight policy: ${error.message}` };
    }
};

/**
 * Interprets hotel cancellation policy JSON.
 * 
 * @param {Array<object>} policyData - Array of policy rules from hotel.data.cancellationPolicies.
 * @param {string | Date} checkInDate - The check-in date (ISO string or Date object).
 * @returns {object} Standardized policy rule object.
 */
exports.interpretHotelPolicy = (policyData, checkInDate) => {
    console.log("[PolicyInterpreter] Interpreting Hotel Policy...");
    if (!policyData || !Array.isArray(policyData) || policyData.length === 0) {
        return { type: 'free' }; // Assume free if no policies defined
    }

    const now = moment(); // Use moment for reliable date comparison
    let activeRule = { type: 'free' }; // Default to free, assumes lowest penalty

    try {
        // Iterate through all policy sets (often just one)
        for (const policySet of policyData) {
            if (!policySet.rules || !Array.isArray(policySet.rules)) continue;

            // Find the rule applicable right now by checking date ranges
            for (const rule of policySet.rules) {
                if (!rule.start || !rule.end) {
                    console.warn("[PolicyInterpreter] Hotel rule missing start or end date:", rule);
                    continue; // Skip rules without proper date ranges
                }
                const ruleStart = moment(rule.start);
                const ruleEnd = moment(rule.end);

                // Check if 'now' falls within this rule's effective period
                if (now.isBetween(ruleStart, ruleEnd, undefined, '[]')) { // '[]' includes start/end
                    let currentRule = { type: 'error', message: 'Invalid rule format' };
                    
                    // Determine rule type and value
                    if (rule.valueType?.toLowerCase() === 'percentage') {
                        if (rule.value === 0) {
                            currentRule = { type: 'free' };
                        } else if (rule.value === 100) {
                            currentRule = { type: 'non-refundable' };
                        } else {
                             currentRule = { type: 'percentage', value: rule.value };
                        }
                    } else if (rule.valueType?.toLowerCase() === 'fixed') {
                         if (rule.value === 0) {
                            currentRule = { type: 'free' };
                        } else {
                            currentRule = { type: 'fixed', value: rule.value };
                        }
                    } 
                    // Add other potential valueTypes if they exist

                    // If this rule is stricter than the current active one, update activeRule
                    if (exports.isRuleStricter(currentRule, activeRule)) {
                        activeRule = currentRule;
                    }
                }
            }
        }
    } catch (error) {
        console.error("[PolicyInterpreter] Error processing hotel policies:", error);
        return { type: 'error', message: `Error processing hotel policy: ${error.message}` };
    }

    return activeRule;
};

/**
 * Interprets activity cancellation policy JSON.
 * 
 * @param {Array<object>} policyData - Array from activity.cancellationFromTourDate.
 * @param {string | Date} tourDate - The date of the activity.
 * @returns {object} Standardized policy rule object.
 */
exports.interpretActivityPolicy = (policyData, tourDate) => {
    console.log("[PolicyInterpreter] Interpreting Activity Policy...");
    if (!policyData || !Array.isArray(policyData) || policyData.length === 0) {
        return { type: 'non-refundable' }; // Assume non-refundable if no policies defined
    }

    try {
        const now = moment().startOf('day');
        const activityDate = moment(tourDate).startOf('day');
        if (!activityDate.isValid()) {
            return { type: 'error', message: 'Invalid tour date provided for policy check.' };
        }
        const daysBefore = activityDate.diff(now, 'days');

        let applicableRule = { type: 'non-refundable' }; // Default to non-refundable

        for (const rule of policyData) {
            // Ensure rule properties exist
            if (typeof rule.dayRangeMin !== 'number' || typeof rule.percentageRefundable !== 'number') {
                console.warn("[PolicyInterpreter] Invalid activity rule format:", rule);
                continue;
            }

            const minDays = rule.dayRangeMin;
            // Treat null maxDays as infinity
            const maxDays = (rule.dayRangeMax === null || typeof rule.dayRangeMax !== 'number') ? Infinity : rule.dayRangeMax;
            
            // Check if current daysBefore falls within this rule's range.
            // GRN Example: min=1,max=null (1 day or more before) -> If daysBefore >= 1
            // GRN Example: min=0,max=1 (day of tour) -> if daysBefore >= 0 and daysBefore < 1
            if (daysBefore >= minDays && daysBefore < maxDays) {
                // Found the rule that applies based on the current date
                if (rule.percentageRefundable === 100) {
                    applicableRule = { type: 'free' };
                } else if (rule.percentageRefundable > 0) {
                    // Calculate PENALTY percentage
                    applicableRule = { type: 'percentage', value: (100 - rule.percentageRefundable) }; 
                } else {
                    applicableRule = { type: 'non-refundable' };
                }
                // Assume GRNConnect provides non-overlapping, definitive rules for a given day range.
                // Therefore, break once the matching range is found.
                break; 
            }
        }
        
        // applicableRule will hold the rule from the matched range, or the default ('non-refundable')
        return applicableRule; 

    } catch (error) {
         console.error("[PolicyInterpreter] Error processing activity policies:", error);
         return { type: 'error', message: `Error processing activity policy: ${error.message}` };
    }
};

/**
 * Interprets AND CALCULATES transfer cancellation policy based on provider data.
 * This replicates the logic previously in transferController.js to determine 
 * the cancellation fee based on time difference from pickup.
 * 
 * @param {object} providerBookingData - The full booking data object fetched from TransferCancellationDetailsService, expecting `booking_date`, `booking_time`, `fare`, `status`.
 * @returns {object} Standardized policy rule object ({ type: 'free' | 'percentage' | 'non-refundable', value?: number })
 */
exports.interpretAndCalculateTransferPolicy = (providerBookingData) => {
    console.log("[PolicyInterpreter] Interpreting and Calculating Transfer Policy...");
    // Validate required fields
    if (!providerBookingData || !providerBookingData.booking_date || !providerBookingData.booking_time) {
        console.warn("[PolicyInterpreter] Missing pickup date/time in transfer data.", providerBookingData);
        return { type: 'error', message: 'Missing pickup date/time from provider.' };
    }

    try {
        // Combine date and time. Assume provider format is consistent (e.g., YYYY-MM-DD, HH:MM:SS)
        // Adjust format string if needed based on actual provider output
        const pickupDateTimeString = `${providerBookingData.booking_date} ${providerBookingData.booking_time}`;
        const pickupDateTime = moment(pickupDateTimeString, "YYYY-MM-DD HH:mm:ss"); 
        
        if (!pickupDateTime.isValid()) { // Check if parsing worked
            console.error("[PolicyInterpreter] Invalid pickup date/time format from provider:", pickupDateTimeString);
            return { type: 'error', message: 'Invalid pickup date/time format from provider.' };
        }

        const now = moment();
        const hoursDifference = pickupDateTime.diff(now, 'hours', true); // Get difference in hours (true for float)

        // Check provider status first
        if (providerBookingData.status?.toLowerCase() === 'cancelled') {
            console.log("[PolicyInterpreter] Transfer already marked as cancelled by provider.");
            // If already cancelled, it's effectively non-refundable from our perspective for further action
            return { type: 'non-refundable', message: 'Already cancelled by provider.' }; 
        }
        
        let rule = { type: 'non-refundable' }; // Default strictness if conditions below aren't met

        // Apply Cancellation Policy Logic based on hours difference (as defined in previous discussions)
        if (hoursDifference >= 48) {
            rule = { type: 'free' };
        } else if (hoursDifference >= 24) {
            rule = { type: 'percentage', value: 50 }; // 50% penalty
        } else if (hoursDifference >= 4) { // Between 4 and 24 hours before
            // Provider policy was "No refund for cancellations within 24 hours" 
            // Let's re-verify this. Original example: "50% charge for cancellations within 24 hours" 
            // Let's stick to the 50% charge between 4 and 24 hours based on the example logic.
            rule = { type: 'percentage', value: 50 }; // Still 50% penalty
        } else {
            // Within 4 hours - "No refund for cancellations within 4 hours."
            rule = { type: 'non-refundable' }; 
        }
        
        return rule;

    } catch (error) {
        console.error("[PolicyInterpreter] Error calculating transfer policy rule:", error);
        return { type: 'error', message: `Error calculating transfer policy: ${error.message}` };
    }
};

/**
 * Summarizes a standardized policy rule into human-readable text.
 * 
 * @param {object} rule - The standardized rule object (e.g., { type: 'percentage', value: 50 }).
 * @param {object | string} [context] - Optional context (e.g., provider booking data for transfers, raw text for flights).
 * @returns {string} Human-readable summary.
 */
exports.summarizePolicy = (rule, context = null) => {
    switch (rule.type) {
        case 'percentage': return `${rule.value}% cancellation penalty applies.`;
        case 'fixed': return `₹${rule.value.toLocaleString('en-IN')} fixed cancellation fee applies.`;
        case 'free': return `Free cancellation applicable.`;
        case 'non-refundable': return `This item is non-refundable.`;
        case 'error': return rule.message || 'Policy could not be determined.';
        default:
             // Specific context examples:
             if (typeof context === 'string') { // Likely flight raw text
                 return `Could not parse rule. Policy: ${context.substring(0, 150)}...`;
             } else if (context?.booking_date && context?.booking_time) { // Likely transfer data
                 // Maybe add deadline info if available/calculated?
                 return `Standard transfer policy applies based on pickup time (${context.booking_date} ${context.booking_time}). Rule: ${rule.type}`; 
             }
             return 'Unknown cancellation policy type.';
    }
};

/**
 * Compares two policy rules to see if rule A is stricter than rule B.
 * Used for hotel policy aggregation where multiple rates might apply.
 * Order of strictness: error > non-refundable > percentage > fixed > free
 * 
 * @param {object} ruleA
 * @param {object} ruleB
 * @returns {boolean} True if ruleA is stricter than ruleB.
 */
exports.isRuleStricter = (ruleA, ruleB) => {
    const strictness = {
        'error': 5,
        'non-refundable': 4,
        'percentage': 3,
        'fixed': 2,
        'free': 1
    };
    
    // Treat null/undefined rules as least strict (free)
    const typeA = ruleA?.type || 'free'; 
    const typeB = ruleB?.type || 'free';

    const scoreA = strictness[typeA] || 0;
    const scoreB = strictness[typeB] || 0;

    if (scoreA > scoreB) return true;
    if (scoreA < scoreB) return false;

    // If types are the same, compare values (higher penalty is stricter)
    if (typeA === 'percentage' || typeA === 'fixed') {
        // Ensure values exist and are numbers before comparing
        const valueA = typeof ruleA?.value === 'number' ? ruleA.value : 0;
        const valueB = typeof ruleB?.value === 'number' ? ruleB.value : 0;
        return valueA > valueB;
    }

    return false; // Same type, no comparable value (e.g., both 'free')
}; 