const express = require('express');
const router = express.Router();

const {updateTransfersForChange, getTransferOptions, revalidateTransfer} = require('../../controllers/itineraryController/transferChangeController');

router.post(
  '/update',
  checkInquiryToken, updateTransfersForChange
);

router.get(
  '/options',
  checkInquiryToken, getTransferOptions
);

router.post(
  '/revalidate',
  checkInquiryToken, revalidateTransfer
);