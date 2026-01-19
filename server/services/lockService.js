class LockService {
  constructor() {
    this.locks = new Map();
  }

  async acquireLock(key, value, timeoutMs = 5000) {
    const now = Date.now();
    
    
    const existingLock = this.locks.get(key);
    if (existingLock) {
      if (now < existingLock.expiresAt) {
        return false; 
      }
      
      this.locks.delete(key);
    }

    
    this.locks.set(key, {
      value,
      expiresAt: now + timeoutMs,
      acquiredAt: now
    });

    
    setTimeout(() => {
      const currentLock = this.locks.get(key);
      if (currentLock && currentLock.value === value) {
        this.locks.delete(key);
      }
    }, timeoutMs);

    return true;
  }

  async releaseLock(key, value) {
    const lock = this.locks.get(key);
    if (lock && lock.value === value) {
      this.locks.delete(key);
      return true;
    }
    return false;
  }

  hasLock(key) {
    const lock = this.locks.get(key);
    return lock && Date.now() < lock.expiresAt;
  }
}

module.exports = new LockService();