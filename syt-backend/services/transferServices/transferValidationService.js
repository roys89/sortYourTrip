class TransferValidationService {
    validateTransferRequest(transferData) {
      const requiredFields = [
        'origin', 
        'destination', 
        'startDate', 
        'travelers'
      ];
  
      for (const field of requiredFields) {
        if (!transferData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
  
      // Validate location data
      this.validateLocation(transferData.origin, 'Origin');
      this.validateLocation(transferData.destination, 'Destination');
    }
  
    validateLocation(location, locationType) {
      const requiredLocationFields = [
        'city', 
        'country', 
        'latitude', 
        'longitude'
      ];
  
      for (const field of requiredLocationFields) {
        if (!location[field]) {
          throw new Error(`Missing ${locationType} location field: ${field}`);
        }
      }
    }
  }
  
  module.exports = new TransferValidationService();