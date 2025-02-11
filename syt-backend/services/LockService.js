// services/LockService.js
const Lock = require('../models/Lock');
const { FlightSupplier, HotelSupplier } = require('./SupplierService');
const { ItineraryService } = require('./ItineraryService');
const { LockError } = require('../utils/errors');
const config = require('../config/lockConfig');

class LockService {
  constructor() {
    this.flightSupplier = new FlightSupplier();
    this.hotelSupplier = new HotelSupplier();
    this.itineraryService = new ItineraryService();
  }

  async createLocks(itineraryToken, inquiryToken, items) {
    const locks = [];
    const errors = [];

    // Get itinerary details for additional context
    const itinerary = await this.itineraryService.getItinerary(itineraryToken, inquiryToken);

    for (const item of items) {
      try {
        let supplierRef;
        let expiryTime;
        let itemDetails;

        // Get supplier hold
        if (item.type === 'flight') {
          itemDetails = this.getFlightDetails(itinerary, item.id);
          const holdResult = await this.flightSupplier.createHold(item.referenceId);
          supplierRef = holdResult.reference;
          expiryTime = holdResult.expiryTime;
        } else if (item.type === 'hotel') {
          itemDetails = this.getHotelDetails(itinerary, item.id);
          const holdResult = await this.hotelSupplier.createHold(item.referenceId);
          supplierRef = holdResult.reference;
          expiryTime = holdResult.expiryTime;
        }

        // Create lock record
        const lock = await Lock.create({
          itineraryToken,
          inquiryToken,
          itemType: item.type,
          itemId: item.id,
          referenceId: item.referenceId,
          supplierReference: supplierRef,
          expiryTime,
          cityName: itemDetails?.cityName,
          date: itemDetails?.date,
          metadata: {
            ...itemDetails,
            originalPrice: itemDetails?.price
          }
        });

        locks.push(lock);
      } catch (error) {
        console.error(`Error creating lock for ${item.type} ${item.id}:`, error);
        errors.push({
          type: item.type,
          id: item.id,
          error: error.message
        });
      }
    }

    return {
      success: errors.length === 0,
      locks,
      errors: errors.length > 0 ? errors : null,
      expiryTime: locks.length > 0 ? 
        Math.min(...locks.map(l => l.expiryTime)) : 
        null
    };
  }

  async checkLockStatus(itineraryToken, inquiryToken) {
    const locks = await Lock.findActiveLocks(itineraryToken, inquiryToken);
    const expiredItems = [];
    let allLocksValid = true;

    const itinerary = await this.itineraryService.getItinerary(itineraryToken, inquiryToken);

    for (const lock of locks) {
      try {
        // Check if lock is expired
        if (new Date() > lock.expiryTime) {
          await lock.setExpired();
          allLocksValid = false;

          const itemDetails = this.getItemDetailsFromItinerary(
            itinerary, 
            lock.itemType, 
            lock.itemId
          );

          expiredItems.push({
            type: lock.itemType,
            details: itemDetails,
            expiryTime: lock.expiryTime
          });
          continue;
        }

        // Verify with supplier
        let isValid;
        if (lock.itemType === 'flight') {
          isValid = await this.flightSupplier.verifyHold(lock.supplierReference);
        } else if (lock.itemType === 'hotel') {
          isValid = await this.hotelSupplier.verifyHold(lock.supplierReference);
        }

        if (!isValid) {
          await lock.setExpired();
          allLocksValid = false;

          const itemDetails = this.getItemDetailsFromItinerary(
            itinerary, 
            lock.itemType, 
            lock.itemId
          );

          expiredItems.push({
            type: lock.itemType,
            details: itemDetails,
            expiryTime: lock.expiryTime
          });
        }
      } catch (error) {
        console.error(`Error checking lock status for ${lock.itemType} ${lock.itemId}:`, error);
        allLocksValid = false;
      }
    }

    return {
      allLocksValid,
      expiredItems: expiredItems.length > 0 ? expiredItems : null,
      locksCount: locks.length,
      expiryTime: locks.length > 0 ? 
        Math.min(...locks.map(l => l.expiryTime)) : 
        null
    };
  }

  async releaseLock(itineraryToken, inquiryToken, type, itemId) {
    const lock = await Lock.findOne({
      itineraryToken,
      inquiryToken,
      itemType: type,
      itemId,
      status: 'active'
    });

    if (!lock) {
        throw new LockError('Lock not found or already released', 'LOCK_NOT_FOUND');
      }
  
      try {
        // Release with supplier
        if (type === 'flight') {
          await this.flightSupplier.releaseHold(lock.supplierReference);
        } else if (type === 'hotel') {
          await this.hotelSupplier.releaseHold(lock.supplierReference);
        }
  
        // Update lock record
        await lock.release();
  
        return {
          success: true,
          message: 'Lock released successfully'
        };
      } catch (error) {
        console.error(`Error releasing lock for ${type} ${itemId}:`, error);
        throw new LockError(`Failed to release lock: ${error.message}`, 'RELEASE_FAILED');
      }
    }
  
    async extendLock(itineraryToken, inquiryToken, type, itemId, additionalTime) {
      const lock = await Lock.findOne({
        itineraryToken,
        inquiryToken,
        itemType: type,
        itemId,
        status: 'active'
      });
  
      if (!lock) {
        throw new LockError('Lock not found or inactive', 'LOCK_NOT_FOUND');
      }
  
      // Check if the lock is already expired
      if (new Date() > lock.expiryTime) {
        throw new LockError('Cannot extend expired lock', 'LOCK_EXPIRED');
      }
  
      try {
        // Extend with supplier
        if (type === 'flight') {
          await this.flightSupplier.extendHold(
            lock.supplierReference, 
            additionalTime
          );
        } else if (type === 'hotel') {
          await this.hotelSupplier.extendHold(
            lock.supplierReference, 
            additionalTime
          );
        }
  
        // Update lock record
        const newExpiryTime = await lock.extend(additionalTime);
  
        return {
          success: true,
          expiryTime: newExpiryTime
        };
      } catch (error) {
        console.error(`Error extending lock for ${type} ${itemId}:`, error);
        throw new LockError(`Failed to extend lock: ${error.message}`, 'EXTEND_FAILED');
      }
    }
  
    async clearAllLocks(itineraryToken, inquiryToken) {
      const locks = await Lock.findActiveLocks(itineraryToken, inquiryToken);
  
      for (const lock of locks) {
        try {
          // Release with supplier
          if (lock.itemType === 'flight') {
            await this.flightSupplier.releaseHold(lock.supplierReference);
          } else if (lock.itemType === 'hotel') {
            await this.hotelSupplier.releaseHold(lock.supplierReference);
          }
  
          // Update lock record
          await lock.release();
        } catch (error) {
          console.error(`Error clearing lock for ${lock.itemType} ${lock.itemId}:`, error);
        }
      }
  
      return {
        success: true,
        clearedCount: locks.length
      };
    }
  
    // Helper methods
    getFlightDetails(itinerary, flightId) {
      for (const city of itinerary.cities) {
        for (const day of city.days) {
          if (day.flights) {
            const flight = day.flights.find(f => f.flightData.flightCode === flightId);
            if (flight) {
              return {
                cityName: city.city,
                date: day.date,
                price: flight.flightData.price || flight.flightData.fareDetails?.finalFare,
                origin: flight.flightData.origin,
                destination: flight.flightData.destination,
                flightType: flight.flightData.type
              };
            }
          }
        }
      }
      return null;
    }
  
    getHotelDetails(itinerary, hotelId) {
      for (const city of itinerary.cities) {
        for (const day of city.days) {
          if (day.hotels) {
            const hotel = day.hotels.find(h => h.data.staticContent[0].id === hotelId);
            if (hotel) {
              return {
                cityName: city.city,
                date: day.date,
                price: hotel.data.items[0]?.selectedRoomsAndRates[0]?.rate?.finalRate,
                hotelName: hotel.data.hotelDetails.name,
                checkIn: hotel.checkIn,
                checkOut: hotel.checkOut
              };
            }
          }
        }
      }
      return null;
    }
  
    async startCleanupJob() {
      console.log('Starting lock cleanup job...');
      
      try {
        // Find expired locks
        const expiredLocks = await Lock.findExpiredLocks();
  
        for (const lock of expiredLocks) {
          try {
            // Release supplier hold
            if (lock.itemType === 'flight') {
              await this.flightSupplier.releaseHold(lock.supplierReference);
            } else if (lock.itemType === 'hotel') {
              await this.hotelSupplier.releaseHold(lock.supplierReference);
            }
  
            // Update lock status
            await lock.setExpired();
          } catch (error) {
            console.error(`Error cleaning up lock ${lock._id}:`, error);
            // Still mark as expired even if supplier release fails
            await lock.setExpired();
          }
        }
  
        // Clean up old records
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 24);
        await Lock.cleanupOldLocks(oldDate);
  
        console.log('Lock cleanup completed successfully');
      } catch (error) {
        console.error('Error in lock cleanup job:', error);
      }
    }
  }
  
  module.exports = new LockService();