const { createClient } = require('redis');

class RedisConnection {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }
}

module.exports = new RedisConnection();