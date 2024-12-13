// frontend/utils/dateUtils.js
import { DateTime } from "luxon";

export const convertToIST = (date) => {
  // If it's already a DateTime object, just set the zone
  if (date instanceof DateTime) {
    return date.setZone('Asia/Kolkata');
  }
  // Otherwise convert from JS Date
  return DateTime.fromJSDate(date).setZone('Asia/Kolkata');
};

export const formatISTToBackend = (date) => {
  if (!date) return null;
  
  // If it's already a DateTime object
  if (date instanceof DateTime) {
    return date.setZone('Asia/Kolkata').toISO();
  }
  
  // If it's a JS Date
  return convertToIST(date).toISO();
};