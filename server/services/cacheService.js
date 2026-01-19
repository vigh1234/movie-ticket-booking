class CacheService {
  constructor() {
    this.cache = new Map();
    
    setInterval(() => this.cleanup(), 60000);
  }

  async set(key, value, ttlSeconds = 5) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
    return 'OK';
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async del(key) {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new CacheService();