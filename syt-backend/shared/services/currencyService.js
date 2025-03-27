const axios = require('axios');

class CurrencyService {
  static async convertToINR(amount, fromCurrency) {
    try {
      const response = await axios.get(`https://open.er-api.com/v6/latest/${fromCurrency}`);
      const inrRate = response.data.rates.INR;
      return (amount * inrRate).toFixed(2);
    } catch (error) {
      console.error('Currency conversion error:', error);
      return null;
    }
  }
}

module.exports = CurrencyService;