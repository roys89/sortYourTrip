const express = require('express');
const router = express.Router();
const Markup = require('../models/Markup');

// Get current markup settings
router.get('/', async (req, res) => {
  try {
    let markup = await Markup.findOne();
    
    if (!markup) {
      // Create default settings if none exist
      markup = await Markup.create({});
    }
    
    res.json(markup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update markup settings
router.post('/', async (req, res) => {
  try {
    const { markups, tcsRates } = req.body;
    
    const markup = await Markup.findOneAndUpdate(
      {}, // empty filter to match any document
      {
        markups,
        tcsRates,
        lastUpdated: new Date()
      },
      {
        new: true, // return updated document
        upsert: true // create if doesn't exist
      }
    );

    res.json(markup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;