// services/tokenManagers/flightTokenManager.js

const tokenStore = new Map();

class FlightTokenManager {
  static async getOrSetToken(inquiryToken, tokenFetcher) {
    // Check if we have a valid token in store
    const storedToken = tokenStore.get(inquiryToken);
    if (storedToken && storedToken.expiresAt > Date.now()) {
      return storedToken.token;
    }

    // Otherwise fetch new token
    const token = await tokenFetcher();
    
    // Store token with expiration (e.g., 1 hour)
    tokenStore.set(inquiryToken, {
      token,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour expiry
    });

    return token;
  }

  static clearToken(inquiryToken) {
    tokenStore.delete(inquiryToken);
  }
}

module.exports = FlightTokenManager;