// utils/hotelUtils.js

/**
 * Get the hotel name from the hotel object
 * @param {Object} hotel - The hotel object
 * @returns {string} Hotel name
 */
export const getHotelName = (hotel) => {
  return hotel.hotel_details?.name || hotel.name || 'Unnamed Hotel';
};

/**
 * Get the main image URL for the hotel
 * @param {Object} hotel - The hotel object
 * @param {string} [fallbackSize='400/300'] - Optional fallback image size
 * @returns {string} Image URL
 */
export const getImageUrl = (hotel, fallbackSize = '400/300') => {
  // Try to get the first image URL from the images array
  if (hotel.images?.[0]?.variants?.[0]?.url) {
    return hotel.images[0].variants[0].url;
  }

  // Try hotel_details images array
  if (hotel.hotel_details?.images?.[0]?.variants?.[0]?.url) {
    return hotel.hotel_details.images[0].variants[0].url;
  }

  // Try direct image URLs
  if (hotel.images?.url || hotel.hotel_details?.images?.url) {
    return hotel.images?.url || hotel.hotel_details?.images?.url;
  }

  // Fallback to placeholder
  return `/api/placeholder/${fallbackSize}`;
};

/**
 * Get the star count for the hotel
 * @param {Object} hotel - The hotel object
 * @returns {number} Number of stars
 */
export const getStarCount = (hotel) => {
  const category = hotel.category || hotel.hotel_details?.category;
  return parseInt(category) || 0;
};

/**
 * Format hotel facilities from either an array or a semicolon-separated string
 * @param {string|string[]} facilities - Facilities array or semicolon-separated string
 * @returns {string[]} Array of formatted facilities
 */
export const formatFacilities = (facilities) => {
  // If facilities is undefined or null, return empty array
  if (!facilities) {
    return [];
  }

  // If facilities is already an array, just map and trim
  if (Array.isArray(facilities)) {
    return facilities.map(facility => facility.trim());
  }

  // If facilities is a string, split by semicolon and trim
  if (typeof facilities === 'string') {
    return facilities.split(';').map(facility => facility.trim());
  }

  // Return empty array for any other type
  return [];
};

/**
 * Get rooms from the hotel object
 * @param {Object} hotel - The hotel object
 * @returns {Array} Array of rooms
 */
export const getRooms = (hotel) => {
  if (hotel.hotel_details?.rooms?.length) {
    return hotel.hotel_details.rooms;
  }

  if (hotel.rate?.rooms?.length) {
    return hotel.rate.rooms;
  }

  if (hotel.rate) {
    return [{
      room_type: hotel.rate.room_type || 'Standard Room',
      no_of_adults: hotel.rate.no_of_adults || 2,
      no_of_children: hotel.rate.no_of_children || 0,
      no_of_rooms: hotel.rate.no_of_rooms || 1
    }];
  }

  return [];
};

/**
 * Get boarding details from the hotel object
 * @param {Object} hotel - The hotel object
 * @returns {string[]} Boarding details
 */
export const getBoardingDetails = (hotel) => {
  return hotel.rate?.boarding_details || [];
};

/**
 * Get hotel rate details
 * @param {Object} hotel - The hotel object
 * @returns {Object|null} Rate details or null
 */
export const getRateDetails = (hotel) => {
  return hotel.rate || null;
};

/**
 * Get cancellation policy details
 * @param {Object} hotel - The hotel object
 * @returns {Object|null} Cancellation policy or null
 */
export const getCancellationPolicy = (hotel) => {
  return hotel.rate?.cancellation_policy || null;
};

/**
 * Check if the hotel rate is refundable
 * @param {Object} hotel - The hotel object
 * @returns {boolean} Whether the rate is refundable
 */
export const isRefundable = (hotel) => {
  return !hotel.rate?.non_refundable;
};

/**
 * Get hotel description
 * @param {Object} hotel - The hotel object
 * @returns {string} Hotel description
 */
export const getHotelDescription = (hotel) => {
  return hotel.hotel_details?.description || hotel.description || '';
};

/**
 * Get check-in and check-out times
 * @param {Object} hotel - The hotel object
 * @returns {Object} Check-in and check-out times
 */
export const getCheckTimes = (hotel) => {
  const hotelDetails = hotel.hotel_details || {};
  return {
    checkIn: hotelDetails.checkin_begin_time || 'Not specified',
    checkOut: hotelDetails.checkout_time || 'Not specified'
  };
};