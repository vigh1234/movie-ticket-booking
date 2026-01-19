const Redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    
    await this.client.connect();
    console.log('Connected to Redis');
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient() {
    return this.client;
  }
}

module.exports = new RedisClient();