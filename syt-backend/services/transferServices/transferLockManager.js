class TransferLockManager {
    constructor() {
      this.locks = new Map();
    }
  
    getLockKey(itineraryToken, cityName, date) {
      return `${itineraryToken}-${cityName}-${date}`;
    }
  
    acquireLock(itineraryToken, cityName, date) {
      const lockKey = this.getLockKey(itineraryToken, cityName, date);
      if (this.locks.get(lockKey)) {
        return false;
      }
      this.locks.set(lockKey, true);
      return true;
    }
  
    releaseLock(itineraryToken, cityName, date) {
      const lockKey = this.getLockKey(itineraryToken, cityName, date);
      this.locks.delete(lockKey);
    }
  }
  
  module.exports = new TransferLockManager();
  