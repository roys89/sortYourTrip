// controllers/LockController.js
const LockService = require('../services/LockService');
const { catchAsync } = require('../utils/errorHandler');
const { validateLockData } = require('../utils/validation');
const { LockError } = require('../utils/errors');

class LockController {
  // Create locks for multiple items
  createLocks = catchAsync(async (req, res) => {
    const { itineraryToken } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];
    const { items } = req.body;

    // Validate request data
    validateLockData(items);

    // Create locks using service
    const result = await LockService.createLocks(
      itineraryToken,
      inquiryToken,
      items
    );

    if (result.errors) {
      throw new LockError('Failed to create some locks', 'LOCK_CREATE_PARTIAL', result.errors);
    }

    res.status(200).json({
      success: true,
      locks: result.locks.map(lock => ({
        type: lock.itemType,
        id: lock.itemId,
        expiryTime: lock.expiryTime,
        status: lock.status
      })),
      expiryTime: result.expiryTime
    });
  });

  // Check status of all locks
  checkStatus = catchAsync(async (req, res) => {
    const { itineraryToken } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];

    const status = await LockService.checkLockStatus(
      itineraryToken,
      inquiryToken
    );

    res.status(200).json({
      success: true,
      ...status
    });
  });

  // Release specific lock
  releaseLock = catchAsync(async (req, res) => {
    const { itineraryToken, type, itemId } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];

    const result = await LockService.releaseLock(
      itineraryToken,
      inquiryToken,
      type,
      itemId
    );

    res.status(200).json({
      success: true,
      message: 'Lock released successfully',
      result
    });
  });

  // Extend lock duration
  extendLock = catchAsync(async (req, res) => {
    const { itineraryToken, type, itemId } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];
    const { additionalTime } = req.body;

    // Validate additional time
    if (!additionalTime || additionalTime <= 0) {
      throw new LockError('Invalid additional time', 'INVALID_EXTENSION_TIME');
    }

    const result = await LockService.extendLock(
      itineraryToken,
      inquiryToken,
      type,
      itemId,
      additionalTime
    );

    res.status(200).json({
      success: true,
      newExpiryTime: result.expiryTime
    });
  });

  // Get detailed lock info
  getLockInfo = catchAsync(async (req, res) => {
    const { itineraryToken, type, itemId } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];

    const lockInfo = await LockService.getLockInfo(
      itineraryToken,
      inquiryToken,
      type,
      itemId
    );

    if (!lockInfo) {
      throw new LockError('Lock not found', 'LOCK_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      lock: lockInfo
    });
  });

  // Clear all locks for an itinerary
  clearLocks = catchAsync(async (req, res) => {
    const { itineraryToken } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];

    await LockService.clearAllLocks(
      itineraryToken,
      inquiryToken
    );

    res.status(200).json({
      success: true,
      message: 'All locks cleared successfully'
    });
  });
}

module.exports = new LockController();