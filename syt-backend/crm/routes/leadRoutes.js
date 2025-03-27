// crm/routes/leadRoutes.js
const express = require('express');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  deleteMultipleLeads,
  uploadLeads
} = require('../controllers/leadController');
const { protect, checkPermission } = require('../middleware/auth');
const { check } = require('express-validator');
const multer = require('multer');

// Set up multer for file uploads
const upload = multer({
  dest: 'tmp/csv/',
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPermission('canViewLeads'), getLeads)
  .post([
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
  ], checkPermission('canAddLead'), createLead);

router.delete('/multiple', checkPermission('canRemoveLead'), deleteMultipleLeads);

router.post('/upload', checkPermission('canAddLead'), upload.single('csv'), uploadLeads);

router
  .route('/:id')
  .get(checkPermission('canViewLeads'), getLead)
  .put(checkPermission('canAddLead'), updateLead)
  .delete(checkPermission('canRemoveLead'), deleteLead);

module.exports = router;