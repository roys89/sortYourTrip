class TransferLocationService {
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
  }
  
  module.exports = new TransferLocationService();