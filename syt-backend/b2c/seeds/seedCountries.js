const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Country = require('../models/Country');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    const countries = [
      { name: 'United States', code: '+1', countryCode: 'US', nationality: 'American', continent: 'North America', neighboringCountries: ['Canada', 'Mexico'] },
      { name: 'India', code: '+91', countryCode: 'IN', nationality: 'Indian', continent: 'Asia', neighboringCountries: ['Pakistan', 'China', 'Bangladesh', 'Nepal', 'Bhutan'] },
      { name: 'United Kingdom', code: '+44', countryCode: 'GB', nationality: 'British', continent: 'Europe', neighboringCountries: ['Ireland', 'France', 'Belgium'] },
      { name: 'Canada', code: '+1', countryCode: 'CA', nationality: 'Canadian', continent: 'North America', neighboringCountries: ['United States'] },
      { name: 'Australia', code: '+61', countryCode: 'AU', nationality: 'Australian', continent: 'Oceania', neighboringCountries: [] },
      { name: 'Germany', code: '+49', countryCode: 'DE', nationality: 'German', continent: 'Europe', neighboringCountries: ['France', 'Poland', 'Switzerland', 'Austria', 'Netherlands'] },
      { name: 'France', code: '+33', countryCode: 'FR', nationality: 'French', continent: 'Europe', neighboringCountries: ['Germany', 'Belgium', 'Spain', 'Switzerland', 'Italy'] },
      { name: 'China', code: '+86', countryCode: 'CN', nationality: 'Chinese', continent: 'Asia', neighboringCountries: ['India', 'Russia', 'Mongolia', 'Vietnam', 'Laos'] },
      { name: 'Brazil', code: '+55', countryCode: 'BR', nationality: 'Brazilian', continent: 'South America', neighboringCountries: ['Argentina', 'Colombia', 'Peru', 'Bolivia', 'Paraguay'] },
      { name: 'South Africa', code: '+27', countryCode: 'ZA', nationality: 'South African', continent: 'Africa', neighboringCountries: ['Namibia', 'Botswana', 'Zimbabwe', 'Mozambique', 'Lesotho'] },
      { name: 'Japan', code: '+81', countryCode: 'JP', nationality: 'Japanese', continent: 'Asia', neighboringCountries: [] },
      { name: 'Mexico', code: '+52', countryCode: 'MX', nationality: 'Mexican', continent: 'North America', neighboringCountries: ['United States', 'Guatemala', 'Belize'] },
      { name: 'Italy', code: '+39', countryCode: 'IT', nationality: 'Italian', continent: 'Europe', neighboringCountries: ['France', 'Switzerland', 'Austria', 'Slovenia'] },
      { name: 'Russia', code: '+7', countryCode: 'RU', nationality: 'Russian', continent: 'Europe/Asia', neighboringCountries: ['China', 'Ukraine', 'Kazakhstan', 'Mongolia', 'Finland'] },
      { name: 'South Korea', code: '+82', countryCode: 'KR', nationality: 'South Korean', continent: 'Asia', neighboringCountries: ['North Korea'] },
      { name: 'Spain', code: '+34', countryCode: 'ES', nationality: 'Spanish', continent: 'Europe', neighboringCountries: ['France', 'Portugal', 'Andorra', 'Gibraltar'] },
      { name: 'Netherlands', code: '+31', countryCode: 'NL', nationality: 'Dutch', continent: 'Europe', neighboringCountries: ['Belgium', 'Germany'] },
      { name: 'Switzerland', code: '+41', countryCode: 'CH', nationality: 'Swiss', continent: 'Europe', neighboringCountries: ['France', 'Germany', 'Italy', 'Austria'] },
      { name: 'New Zealand', code: '+64', countryCode: 'NZ', nationality: 'New Zealander', continent: 'Oceania', neighboringCountries: [] },
      { name: 'Argentina', code: '+54', countryCode: 'AR', nationality: 'Argentinian', continent: 'South America', neighboringCountries: ['Chile', 'Brazil', 'Bolivia', 'Paraguay', 'Uruguay'] },
      { name: 'Nigeria', code: '+234', countryCode: 'NG', nationality: 'Nigerian', continent: 'Africa', neighboringCountries: ['Benin', 'Niger', 'Chad', 'Cameroon'] },
      { name: 'Pakistan', code: '+92', countryCode: 'PK', nationality: 'Pakistani', continent: 'Asia', neighboringCountries: ['India', 'Afghanistan', 'Iran', 'China'] },
      { name: 'Turkey', code: '+90', countryCode: 'TR', nationality: 'Turkish', continent: 'Europe/Asia', neighboringCountries: ['Greece', 'Bulgaria', 'Syria', 'Iraq', 'Iran'] },
      { name: 'United Arab Emirates', code: '+971', countryCode: 'AE', nationality: 'Emirati', continent: 'Asia', neighboringCountries: ['Saudi Arabia', 'Oman'] },
      { name: 'Singapore', code: '+65', countryCode: 'SG', nationality: 'Singaporean', continent: 'Asia', neighboringCountries: ['Malaysia'] },
      { name: 'Bangladesh', code: '+880', countryCode: 'BD', nationality: 'Bangladeshi', continent: 'Asia', neighboringCountries: ['India', 'Myanmar'] },
      { name: 'Saudi Arabia', code: '+966', countryCode: 'SA', nationality: 'Saudi', continent: 'Asia', neighboringCountries: ['Yemen', 'Jordan', 'Iraq', 'Kuwait', 'Oman'] },
      { name: 'Malaysia', code: '+60', countryCode: 'MY', nationality: 'Malaysian', continent: 'Asia', neighboringCountries: ['Thailand', 'Singapore'] },
      { name: 'Philippines', code: '+63', countryCode: 'PH', nationality: 'Filipino', continent: 'Asia', neighboringCountries: [] },
      { name: 'Thailand', code: '+66', countryCode: 'TH', nationality: 'Thai', continent: 'Asia', neighboringCountries: ['Myanmar', 'Laos', 'Cambodia', 'Malaysia'] },
      { name: 'Egypt', code: '+20', countryCode: 'EG', nationality: 'Egyptian', continent: 'Africa', neighboringCountries: ['Sudan', 'Libya', 'Israel'] },
      { name: 'Vietnam', code: '+84', countryCode: 'VN', nationality: 'Vietnamese', continent: 'Asia', neighboringCountries: ['China', 'Laos', 'Cambodia'] },
      { name: 'Sweden', code: '+46', countryCode: 'SE', nationality: 'Swedish', continent: 'Europe', neighboringCountries: ['Norway', 'Finland'] },
      { name: 'Norway', code: '+47', countryCode: 'NO', nationality: 'Norwegian', continent: 'Europe', neighboringCountries: ['Sweden', 'Finland', 'Russia'] },
      { name: 'Denmark', code: '+45', countryCode: 'DK', nationality: 'Danish', continent: 'Europe', neighboringCountries: ['Germany'] },
      { name: 'Finland', code: '+358', countryCode: 'FI', nationality: 'Finnish', continent: 'Europe', neighboringCountries: ['Sweden', 'Russia', 'Norway'] },
      { name: 'Poland', code: '+48', countryCode: 'PL', nationality: 'Polish', continent: 'Europe', neighboringCountries: ['Germany', 'Czech Republic', 'Ukraine', 'Belarus', 'Slovakia'] },
      { name: 'Greece', code: '+30', countryCode: 'GR', nationality: 'Greek', continent: 'Europe', neighboringCountries: ['Turkey', 'Albania', 'North Macedonia', 'Bulgaria'] },
      { name: 'Austria', code: '+43', countryCode: 'AT', nationality: 'Austrian', continent: 'Europe', neighboringCountries: ['Germany', 'Italy', 'Switzerland', 'Slovakia', 'Czech Republic'] },
      { name: 'Israel', code: '+972', countryCode: 'IL', nationality: 'Israeli', continent: 'Asia', neighboringCountries: ['Egypt', 'Jordan', 'Lebanon', 'Syria'] },
      { name: 'Portugal', code: '+351', countryCode: 'PT', nationality: 'Portuguese', continent: 'Europe', neighboringCountries: ['Spain'] },
      { name: 'Belgium', code: '+32', countryCode: 'BE', nationality: 'Belgian', continent: 'Europe', neighboringCountries: ['France', 'Netherlands', 'Germany'] },
      { name: 'Ireland', code: '+353', countryCode: 'IE', nationality: 'Irish', continent: 'Europe', neighboringCountries: ['United Kingdom'] },
      { name: 'Czech Republic', code: '+420', countryCode: 'CZ', nationality: 'Czech', continent: 'Europe', neighboringCountries: ['Germany', 'Austria', 'Poland', 'Slovakia'] },
      { name: 'Hungary', code: '+36', countryCode: 'HU', nationality: 'Hungarian', continent: 'Europe', neighboringCountries: ['Slovakia', 'Austria', 'Romania', 'Croatia', 'Serbia'] },
      { name: 'Romania', code: '+40', countryCode: 'RO', nationality: 'Romanian', continent: 'Europe', neighboringCountries: ['Hungary', 'Ukraine', 'Serbia', 'Bulgaria'] },
      { name: 'Ukraine', code: '+380', countryCode: 'UA', nationality: 'Ukrainian', continent: 'Europe', neighboringCountries: ['Russia', 'Belarus', 'Poland', 'Slovakia', 'Hungary'] },
      { name: 'Chile', code: '+56', countryCode: 'CL', nationality: 'Chilean', continent: 'South America', neighboringCountries: ['Argentina', 'Bolivia', 'Peru'] },
      { name: 'Colombia', code: '+57', countryCode: 'CO', nationality: 'Colombian', continent: 'South America', neighboringCountries: ['Brazil', 'Venezuela', 'Panama', 'Peru', 'Ecuador'] },
      { name: 'Peru', code: '+51', countryCode: 'PE', nationality: 'Peruvian', continent: 'South America', neighboringCountries: ['Brazil', 'Colombia', 'Ecuador', 'Chile', 'Bolivia'] }
    ];

    return Country.insertMany(countries);
  })
  .then(() => {
    console.log('Countries inserted successfully');
  })
  .catch((error) => {
    console.log('Error inserting countries:', error);
  })
  .finally(() => {
    mongoose.connection.close();
  });