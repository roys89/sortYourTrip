// jobs/lockCleanup.js
const Lock = require('../models/Lock');
const { FlightSupplier, HotelSupplier } = require('../services/SupplierService');

class LockCleanupJob {
  constructor() {
    this.flightSupplier = new FlightSupplier();
    this.hotelSupplier = new HotelSupplier();
  }

  // Run cleanup job
  async cleanupExpiredLocks() {
    try {
      console.log('Starting lock cleanup job...');

      // Find all expired locks
      const expiredLocks = await Lock.find({
        status: 'active',
        expiryTime: { $lt: new Date() }
      });

      console.log(`Found ${expiredLocks.length} expired locks`);

      for (const lock of expiredLocks) {
        try {
          // Release supplier hold
          if (lock.itemType === 'flight') {
            await this.flightSupplier.releaseHold(lock.supplierReference);
          } else if (lock.itemType === 'hotel') {
            await this.hotelSupplier.releaseHold(lock.supplierReference);
          }

          // Update lock status
          lock.status = 'expired';
          await lock.save();

          console.log(`Successfully cleaned up lock: ${lock._id}`);
        } catch (error) {
          console.error(`Error cleaning up lock ${lock._id}:`, error);
          
          // Mark as expired even if supplier release fails
          lock.status = 'expired';
          await lock.save();
        }
      }

      // Clean up old expired/released locks (e.g., older than 24 hours)
      const oldLocksCleanupDate = new Date();
      oldLocksCleanupDate.setHours(oldLocksCleanupDate.getHours() - 24);

      await Lock.deleteMany({
        status: { $in: ['expired', 'released'] },
        updatedAt: { $lt: oldLocksCleanupDate }
      });

      console.log('Lock cleanup job completed successfully');
    } catch (error) {
      console.error('Error in lock cleanup job:', error);
    }
  }

  // Schedule job to run every minute
  schedule() {
    console.log('Scheduling lock cleanup job...');
    setInterval(() => {
      this.cleanupExpiredLocks();
    }, 60 * 1000); // Run every minute
  }
}

// Create and start the job
const lockCleanup = new LockCleanupJob();

// Export for use in app.js
module.exports = lockCleanup;