// config/grnc/apiKey.js

require('dotenv').config();

const GRNC_API_KEY = process.env.GRNC_API_KEY;

if (!GRNC_API_KEY) {
  throw new Error('GRNC API key is not set in environment variables.');
}

module.exports = GRNC_API_KEY;
