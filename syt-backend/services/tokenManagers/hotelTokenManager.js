// services/tokenManagers/hotelTokenManager.js
const NodeCache = require('node-cache');

class HotelTokenManager {
  constructor() {
    // 55 min TTL (tokens usually expire in 1 hour)
    this.tokenCache = new NodeCache({ stdTTL: 3300 }); 
  }

  async getOrSetToken(inquiryToken, tokenFetcher) {
    let token = this.tokenCache.get(inquiryToken);

    if (!token) {
      token = await tokenFetcher(inquiryToken);
      this.tokenCache.set(inquiryToken, token);
    }

    return token;
  }

  removeToken(inquiryToken) {
    this.tokenCache.del(inquiryToken);
  }
}

module.exports = new HotelTokenManager();