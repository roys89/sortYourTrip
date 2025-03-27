const Country = require('../models/Country');

class CountryController {
  async getAllCountries(req, res) {
    try {
      const countries = await Country.find().select('name code countryCode nationality');
      res.status(200).json(countries);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getCountryByCode(req, res) {
    const { code } = req.params;
    try {
      const country = await Country.findOne({ code });
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      res.status(200).json(country);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = new CountryController();
