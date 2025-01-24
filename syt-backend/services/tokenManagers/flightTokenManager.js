const NodeCache = require('node-cache');

class FlightTokenManager {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 3300,  // 55 minutes 
      checkperiod: 120 // Check every 2 minutes
    });
  }

  async getOrSetToken(tokenFetcher) {
    try {
      const key = 'flight_token';
      const cachedData = this.cache.get(key);
      
      if (cachedData) {
        const { token, expiresAt } = cachedData;
        
        if (expiresAt > Date.now()) {
          if (expiresAt - Date.now() < 5 * 60 * 1000) {
            console.log('Global flight token expiring soon, refreshing...');
            this.clearToken();
            return this.getOrSetToken(tokenFetcher);
          }
          console.log('Using cached global flight token');
          return token;
        }
      }
      
      console.log('Fetching new global flight token');
      const token = await tokenFetcher();
      
      const tokenData = {
        token,
        expiresAt: Date.now() + 55 * 60 * 1000
      };

      this.cache.set(key, tokenData);
      return token;

    } catch (error) {
      console.error('Error in flight token manager:', error);
      return tokenFetcher();
    }
  }

  clearToken() {
    const key = 'flight_token';
    this.cache.del(key);
    console.log('Cleared global flight token');
  }

  getAllTokens() {
    const key = 'flight_token';
    const tokenData = this.cache.get(key);
    return tokenData ? [{ key, ...tokenData }] : [];
  }

  disconnect() {
    this.cache.flushAll();
    console.log('Flight token cache cleared');
  }
}

module.exports = new FlightTokenManager();