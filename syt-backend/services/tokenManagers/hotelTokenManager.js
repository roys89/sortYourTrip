const NodeCache = require('node-cache');

class HotelTokenManager {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 3300,
      checkperiod: 120
    });
  }

  async getOrSetToken(tokenFetcher) {
    try {
      const key = 'hotel_token';
      const cachedData = this.cache.get(key);
      
      if (cachedData) {
        const { token, expiresAt } = cachedData;
        
        if (expiresAt > Date.now()) {
          if (expiresAt - Date.now() < 5 * 60 * 1000) {
            console.log('Global hotel token expiring soon, refreshing...');
            this.clearToken();
            return this.getOrSetToken(tokenFetcher);
          }
          console.log('Using cached global hotel token');
          return token;
        }
      }
      
      console.log('Fetching new global hotel token');
      const token = await tokenFetcher();
      
      const tokenData = {
        token,
        expiresAt: Date.now() + 55 * 60 * 1000
      };

      this.cache.set(key, tokenData);
      return token;

    } catch (error) {
      console.error('Error in hotel token manager:', error);
      return tokenFetcher();
    }
  }

  clearToken() {
    const key = 'hotel_token';
    this.cache.del(key);
    console.log('Cleared global hotel token');
  }

  getAllTokens() {
    const key = 'hotel_token';
    const tokenData = this.cache.get(key);
    return tokenData ? [{ key, ...tokenData }] : [];
  }

  disconnect() {
    this.cache.flushAll();
    console.log('Hotel token cache cleared');
  }
}

module.exports = new HotelTokenManager();