// middleware/validation.js
const { LockError } = require('../utils/errors');

const validateLockRequest = (req, res, next) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    throw new LockError('Items must be an array', 'INVALID_REQUEST');
  }

  items.forEach(item => {
    if (!item.type || !item.id || !item.referenceId) {
      throw new LockError(
        'Each item must have type, id, and referenceId',
        'INVALID_ITEM'
      );
    }

    if (!['flight', 'hotel'].includes(item.type)) {
      throw new LockError(
        `Invalid item type: ${item.type}`,
        'INVALID_ITEM_TYPE'
      );
    }
  });

  next();
};

module.exports = {
  validateLockRequest
};

// utils/errors.js
class LockError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'LockError';
    this.code = code;
    this.details = details;
  }
}

const ERROR_CODES = {
  LOCK_NOT_FOUND: 'Lock not found',
  LOCK_EXPIRED: 'Lock has expired',
  LOCK_CREATE_FAILED: 'Failed to create lock',
  LOCK_RELEASE_FAILED: 'Failed to release lock',
  LOCK_EXTEND_FAILED: 'Failed to extend lock',
  INVALID_REQUEST: 'Invalid request format',
  INVALID_ITEM: 'Invalid item data',
  INVALID_ITEM_TYPE: 'Invalid item type',
  SUPPLIER_ERROR: 'Supplier error occurred'
};

module.exports = {
  LockError,
  ERROR_CODES
};