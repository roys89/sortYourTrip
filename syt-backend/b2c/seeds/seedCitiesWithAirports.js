const mongoose = require('mongoose');
const CityAirport = require('../shared/models/CityAirport');
require('dotenv').config();

const cityAirports = [
  // Europe
  { city: 'London', name: 'Heathrow Airport', iata: 'LHR', country: 'United Kingdom', destination_id: 101, latitude: 51.4700, longitude: -0.4543 },
  { city: 'London', name: 'Gatwick Airport', iata: 'LGW', country: 'United Kingdom', destination_id: 111, latitude: 51.1537, longitude: -0.1821 },
  { city: 'London', name: 'Stansted Airport', iata: 'STN', country: 'United Kingdom', destination_id: 112, latitude: 51.8850, longitude: 0.2350 },
  { city: 'London', name: 'Luton Airport', iata: 'LTN', country: 'United Kingdom', destination_id: 127, latitude: 51.8747, longitude: -0.3683 },
  { city: 'Manchester', name: 'Manchester Airport', iata: 'MAN', country: 'United Kingdom', destination_id: 128, latitude: 53.3537, longitude: -2.2749 },
  { city: 'Paris', name: 'Charles de Gaulle Airport', iata: 'CDG', country: 'France', destination_id: 102, latitude: 49.0097, longitude: 2.5479 },
  { city: 'Paris', name: 'Orly Airport', iata: 'ORY', country: 'France', destination_id: 113, latitude: 48.7262, longitude: 2.3652 },
  { city: 'Nice', name: 'Nice Côte dAzur Airport', iata: 'NCE', country: 'France', destination_id: 129, latitude: 43.6653, longitude: 7.2150 },
  { city: 'Frankfurt', name: 'Frankfurt Airport', iata: 'FRA', country: 'Germany', destination_id: 103, latitude: 50.0379, longitude: 8.5622 },
  { city: 'Munich', name: 'Munich Airport', iata: 'MUC', country: 'Germany', destination_id: 114, latitude: 48.3537, longitude: 11.7861 },
  { city: 'Berlin', name: 'Berlin Brandenburg Airport', iata: 'BER', country: 'Germany', destination_id: 115, latitude: 52.3667, longitude: 13.5033 },
  { city: 'Düsseldorf', name: 'Düsseldorf Airport', iata: 'DUS', country: 'Germany', destination_id: 130, latitude: 51.2895, longitude: 6.7668 },
  { city: 'Hamburg', name: 'Hamburg Airport', iata: 'HAM', country: 'Germany', destination_id: 131, latitude: 53.6304, longitude: 9.9882 },
  { city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', iata: 'AMS', country: 'Netherlands', destination_id: 104, latitude: 52.3105, longitude: 4.7683 },
  { city: 'Madrid', name: 'Madrid-Barajas Airport', iata: 'MAD', country: 'Spain', destination_id: 105, latitude: 40.4983, longitude: -3.5676 },
  { city: 'Barcelona', name: 'Barcelona El Prat Airport', iata: 'BCN', country: 'Spain', destination_id: 116, latitude: 41.2974, longitude: 2.0833 },
  { city: 'Palma de Mallorca', name: 'Palma de Mallorca Airport', iata: 'PMI', country: 'Spain', destination_id: 132, latitude: 39.5517, longitude: 2.7388 },
  { city: 'Málaga', name: 'Málaga Airport', iata: 'AGP', country: 'Spain', destination_id: 133, latitude: 36.6749, longitude: -4.4991 },
  { city: 'Rome', name: 'Leonardo da Vinci–Fiumicino Airport', iata: 'FCO', country: 'Italy', destination_id: 106, latitude: 41.8003, longitude: 12.2388 },
  { city: 'Rome', name: 'Ciampino–G. B. Pastine International Airport', iata: 'CIA', country: 'Italy', destination_id: 134, latitude: 41.7994, longitude: 12.5949 },
  { city: 'Milan', name: 'Milan Malpensa Airport', iata: 'MXP', country: 'Italy', destination_id: 117, latitude: 45.6301, longitude: 8.7239 },
  { city: 'Milan', name: 'Milan Linate Airport', iata: 'LIN', country: 'Italy', destination_id: 135, latitude: 45.4601, longitude: 9.2798 },
  { city: 'Venice', name: 'Venice Marco Polo Airport', iata: 'VCE', country: 'Italy', destination_id: 136, latitude: 45.5053, longitude: 12.3519 },
  { city: 'Zurich', name: 'Zurich Airport', iata: 'ZRH', country: 'Switzerland', destination_id: 107, latitude: 47.4647, longitude: 8.5492 },
  { city: 'Geneva', name: 'Geneva Airport', iata: 'GVA', country: 'Switzerland', destination_id: 118, latitude: 46.2381, longitude: 6.1089 },
  { city: 'Copenhagen', name: 'Copenhagen Airport', iata: 'CPH', country: 'Denmark', destination_id: 108, latitude: 55.6180, longitude: 12.6508 },
  { city: 'Oslo', name: 'Oslo Airport, Gardermoen', iata: 'OSL', country: 'Norway', destination_id: 119, latitude: 60.1976, longitude: 11.1004 },
  { city: 'Stockholm', name: 'Stockholm Arlanda Airport', iata: 'ARN', country: 'Sweden', destination_id: 120, latitude: 59.6498, longitude: 17.9238 },
  { city: 'Helsinki', name: 'Helsinki-Vantaa Airport', iata: 'HEL', country: 'Finland', destination_id: 137, latitude: 60.3172, longitude: 24.9633 },
  { city: 'Vienna', name: 'Vienna International Airport', iata: 'VIE', country: 'Austria', destination_id: 109, latitude: 48.1103, longitude: 16.5697 },
  { city: 'Lisbon', name: 'Lisbon Airport', iata: 'LIS', country: 'Portugal', destination_id: 110, latitude: 38.7742, longitude: -9.1342 },
  { city: 'Dublin', name: 'Dublin Airport', iata: 'DUB', country: 'Ireland', destination_id: 121, latitude: 53.4264, longitude: -6.2499 },
  { city: 'Brussels', name: 'Brussels Airport', iata: 'BRU', country: 'Belgium', destination_id: 122, latitude: 50.9010, longitude: 4.4856 },
  { city: 'Istanbul', name: 'Istanbul Airport', iata: 'IST', country: 'Turkey', destination_id: 123, latitude: 41.2753, longitude: 28.7519 },
  { city: 'Istanbul', name: 'Sabiha Gökçen International Airport', iata: 'SAW', country: 'Turkey', destination_id: 138, latitude: 40.8986, longitude: 29.3092 },
  { city: 'Antalya', name: 'Antalya Airport', iata: 'AYT', country: 'Turkey', destination_id: 139, latitude: 36.8987, longitude: 30.8005 },
  { city: 'Athens', name: 'Athens International Airport', iata: 'ATH', country: 'Greece', destination_id: 124, latitude: 37.9364, longitude: 23.9445 },
  { city: 'Prague', name: 'Václav Havel Airport Prague', iata: 'PRG', country: 'Czech Republic', destination_id: 125, latitude: 50.1008, longitude: 14.2631 },
  { city: 'Warsaw', name: 'Warsaw Chopin Airport', iata: 'WAW', country: 'Poland', destination_id: 126, latitude: 52.1657, longitude: 20.9671 },
  { city: 'Budapest', name: 'Budapest Ferenc Liszt International Airport', iata: 'BUD', country: 'Hungary', destination_id: 140, latitude: 47.4399, longitude: 19.2567 },
  { city: 'Moscow', name: 'Sheremetyevo International Airport', iata: 'SVO', country: 'Russia', destination_id: 141, latitude: 55.9726, longitude: 37.4146 },
  { city: 'Moscow', name: 'Domodedovo International Airport', iata: 'DME', country: 'Russia', destination_id: 142, latitude: 55.4088, longitude: 37.9063 },
  { city: 'Moscow', name: 'Vnukovo International Airport', iata: 'VKO', country: 'Russia', destination_id: 165, latitude: 55.5915, longitude: 37.2615 },
  { city: 'Saint Petersburg', name: 'Pulkovo Airport', iata: 'LED', country: 'Russia', destination_id: 166, latitude: 59.8003, longitude: 30.2625 },

  // Asia
  { city: 'Tokyo', name: 'Narita International Airport', iata: 'NRT', country: 'Japan', destination_id: 201, latitude: 35.7647, longitude: 140.3864 },
  { city: 'Tokyo', name: 'Haneda Airport', iata: 'HND', country: 'Japan', destination_id: 202, latitude: 35.5523, longitude: 139.7798 },
  { city: 'Osaka', name: 'Kansai International Airport', iata: 'KIX', country: 'Japan', destination_id: 216, latitude: 34.4347, longitude: 135.2440 },
  { city: 'Fukuoka', name: 'Fukuoka Airport', iata: 'FUK', country: 'Japan', destination_id: 230, latitude: 33.5860, longitude: 130.4506 },
  { city: 'Sapporo', name: 'New Chitose Airport', iata: 'CTS', country: 'Japan', destination_id: 231, latitude: 42.7752, longitude: 141.6923 },
  { city: 'Seoul', name: 'Incheon International Airport', iata: 'ICN', country: 'South Korea', destination_id: 203, latitude: 37.4691, longitude: 126.4505 },
  { city: 'Seoul', name: 'Gimpo International Airport', iata: 'GMP', country: 'South Korea', destination_id: 217, latitude: 37.5583, longitude: 126.7906 },
  { city: 'Busan', name: 'Gimhae International Airport', iata: 'PUS', country: 'South Korea', destination_id: 232, latitude: 35.1781, longitude: 128.9383 },
  { city: 'Jeju', name: 'Jeju International Airport', iata: 'CJU', country: 'South Korea', destination_id: 233, latitude: 33.5114, longitude: 126.4930 },
  { city: 'Beijing', name: 'Beijing Capital International Airport', iata: 'PEK', country: 'China', destination_id: 204, latitude: 40.0801, longitude: 116.5846 },
  { city: 'Beijing', name: 'Beijing Daxing International Airport', iata: 'PKX', country: 'China', destination_id: 218, latitude: 39.5093, longitude: 116.4106 },
  { city: 'Shanghai', name: 'Shanghai Pudong International Airport', iata: 'PVG', country: 'China', destination_id: 205, latitude: 31.1434, longitude: 121.8053 },
  { city: 'Shanghai', name: 'Shanghai Hongqiao International Airport', iata: 'SHA', country: 'China', destination_id: 219, latitude: 31.1979, longitude: 121.3363 },
  { city: 'Guangzhou', name: 'Guangzhou Baiyun International Airport', iata: 'CAN', country: 'China', destination_id: 220, latitude: 23.3924, longitude: 113.2988 },
  { city: 'Chengdu', name: 'Chengdu Shuangliu International Airport', iata: 'CTU', country: 'China', destination_id: 234, latitude: 30.5785, longitude: 103.9471 }, // Note: CTU is replaced by TFU for most international
  { city: 'Chengdu', name: 'Chengdu Tianfu International Airport', iata: 'TFU', country: 'China', destination_id: 235, latitude: 30.3165, longitude: 104.4467 },
  { city: 'Shenzhen', name: 'Shenzhen Baoan International Airport', iata: 'SZX', country: 'China', destination_id: 236, latitude: 22.6393, longitude: 113.8107 },
  { city: 'Kunming', name: 'Kunming Changshui International Airport', iata: 'KMG', country: 'China', destination_id: 237, latitude: 25.1019, longitude: 102.9301 },
  { city: 'Hong Kong', name: 'Hong Kong International Airport', iata: 'HKG', country: 'Hong Kong', destination_id: 206, latitude: 22.3080, longitude: 113.9185 },
  { city: 'Taipei', name: 'Taiwan Taoyuan International Airport', iata: 'TPE', country: 'Taiwan', destination_id: 221, latitude: 25.0777, longitude: 121.2328 },
  { city: 'Singapore', name: 'Singapore Changi Airport', iata: 'SIN', country: 'Singapore', destination_id: 207, latitude: 1.3644, longitude: 103.9915 },
  { city: 'Bangkok', name: 'Suvarnabhumi Airport', iata: 'BKK', country: 'Thailand', destination_id: 208, latitude: 13.6899, longitude: 100.7501 },
  { city: 'Bangkok', name: 'Don Mueang International Airport', iata: 'DMK', country: 'Thailand', destination_id: 222, latitude: 13.9126, longitude: 100.6068 },
  { city: 'Phuket', name: 'Phuket International Airport', iata: 'HKT', country: 'Thailand', destination_id: 238, latitude: 8.1132, longitude: 98.3169 },
  { city: 'Delhi', name: 'Indira Gandhi International Airport', iata: 'DEL', country: 'India', destination_id: 209, latitude: 28.5562, longitude: 77.1000 },
  { city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', iata: 'BOM', country: 'India', destination_id: 210, latitude: 19.0896, longitude: 72.8656 },
  { city: 'Bengaluru', name: 'Kempegowda International Airport Bengaluru', iata: 'BLR', country: 'India', destination_id: 223, latitude: 13.1986, longitude: 77.7066 },
  { city: 'Chennai', name: 'Chennai International Airport', iata: 'MAA', country: 'India', destination_id: 224, latitude: 12.9941, longitude: 80.1709 },
  { city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International Airport', iata: 'CCU', country: 'India', destination_id: 225, latitude: 22.6547, longitude: 88.4467 },
  { city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', iata: 'HYD', country: 'India', destination_id: 239, latitude: 17.2313, longitude: 78.4298 },
  { city: 'Dubai', name: 'Dubai International Airport', iata: 'DXB', country: 'United Arab Emirates', destination_id: 211, latitude: 25.2532, longitude: 55.3657 },
  { city: 'Dubai', name: 'Al Maktoum International Airport', iata: 'DWC', country: 'United Arab Emirates', destination_id: 240, latitude: 24.8964, longitude: 55.1753 },
  { city: 'Dubai', name: 'Dubai International Airport - Bus station', iata: 'XNB', country: 'United Arab Emirates', destination_id: 212, latitude: 25.2532, longitude: 55.3657 }, // Using DXB coordinates as proxy
  { city: 'Abu Dhabi', name: 'Abu Dhabi International Airport', iata: 'AUH', country: 'United Arab Emirates', destination_id: 226, latitude: 24.4330, longitude: 54.6511 },
  { city: 'Doha', name: 'Hamad International Airport', iata: 'DOH', country: 'Qatar', destination_id: 227, latitude: 25.2731, longitude: 51.6081 },
  { city: 'Riyadh', name: 'King Khalid International Airport', iata: 'RUH', country: 'Saudi Arabia', destination_id: 241, latitude: 24.9576, longitude: 46.6988 },
  { city: 'Jeddah', name: 'King Abdulaziz International Airport', iata: 'JED', country: 'Saudi Arabia', destination_id: 242, latitude: 21.6796, longitude: 39.1565 },
  { city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', iata: 'KUL', country: 'Malaysia', destination_id: 213, latitude: 2.7456, longitude: 101.7072 },
  { city: 'Manila', name: 'Ninoy Aquino International Airport', iata: 'MNL', country: 'Philippines', destination_id: 214, latitude: 14.5086, longitude: 121.0194 },
  { city: 'Jakarta', name: 'Soekarno–Hatta International Airport', iata: 'CGK', country: 'Indonesia', destination_id: 215, latitude: -6.1256, longitude: 106.6559 },
  { city: 'Denpasar', name: 'Ngurah Rai International Airport', iata: 'DPS', country: 'Indonesia', destination_id: 243, latitude: -8.7485, longitude: 115.1671 },
  { city: 'Ho Chi Minh City', name: 'Tan Son Nhat International Airport', iata: 'SGN', country: 'Vietnam', destination_id: 228, latitude: 10.8189, longitude: 106.6519 },
  { city: 'Hanoi', name: 'Noi Bai International Airport', iata: 'HAN', country: 'Vietnam', destination_id: 229, latitude: 21.2212, longitude: 105.8072 },
  { city: 'Karachi', name: 'Jinnah International Airport', iata: 'KHI', country: 'Pakistan', destination_id: 244, latitude: 24.9073, longitude: 67.1607 },
  { city: 'Lahore', name: 'Allama Iqbal International Airport', iata: 'LHE', country: 'Pakistan', destination_id: 245, latitude: 31.5216, longitude: 74.4036 },
  // Additional European Airports
  { city: 'Rome', name: 'Ciampino Airport', iata: 'CIA', country: 'Italy', destination_id: 143, latitude: 41.7994, longitude: 12.5949 },
  { city: 'Milan', name: 'Bergamo Orio al Serio Airport', iata: 'BGY', country: 'Italy', destination_id: 144, latitude: 45.6688, longitude: 9.7043 },
  { city: 'Naples', name: 'Naples International Airport', iata: 'NAP', country: 'Italy', destination_id: 145, latitude: 40.8844, longitude: 14.2908 },
  { city: 'Catania', name: 'Catania–Fontanarossa Airport', iata: 'CTA', country: 'Italy', destination_id: 146, latitude: 37.4668, longitude: 15.0664 },
  { city: 'Porto', name: 'Porto Airport', iata: 'OPO', country: 'Portugal', destination_id: 147, latitude: 41.2350, longitude: -8.6708 },
  { city: 'Faro', name: 'Faro Airport', iata: 'FAO', country: 'Portugal', destination_id: 148, latitude: 37.0175, longitude: -7.9694 },
  { city: 'Alicante', name: 'Alicante–Elche Miguel Hernández Airport', iata: 'ALC', country: 'Spain', destination_id: 149, latitude: 38.2822, longitude: -0.5582 },
  { city: 'Valencia', name: 'Valencia Airport', iata: 'VLC', country: 'Spain', destination_id: 150, latitude: 39.4893, longitude: -0.4816 },
  { city: 'Ibiza', name: 'Ibiza Airport', iata: 'IBZ', country: 'Spain', destination_id: 151, latitude: 38.8729, longitude: 1.3731 },
  { city: 'Tenerife', name: 'Tenerife South Airport', iata: 'TFS', country: 'Spain', destination_id: 152, latitude: 28.0445, longitude: -16.5725 },
  { city: 'Lyon', name: 'Lyon–Saint-Exupéry Airport', iata: 'LYS', country: 'France', destination_id: 153, latitude: 45.7256, longitude: 5.0811 },
  { city: 'Marseille', name: 'Marseille Provence Airport', iata: 'MRS', country: 'France', destination_id: 154, latitude: 43.4367, longitude: 5.2150 },
  { city: 'Toulouse', name: 'Toulouse–Blagnac Airport', iata: 'TLS', country: 'France', destination_id: 155, latitude: 43.6350, longitude: 1.3638 },
  { city: 'Birmingham', name: 'Birmingham Airport', iata: 'BHX', country: 'United Kingdom', destination_id: 156, latitude: 52.4539, longitude: -1.7480 },
  { city: 'Edinburgh', name: 'Edinburgh Airport', iata: 'EDI', country: 'United Kingdom', destination_id: 157, latitude: 55.9500, longitude: -3.3725 },
  { city: 'Glasgow', name: 'Glasgow Airport', iata: 'GLA', country: 'United Kingdom', destination_id: 158, latitude: 55.8719, longitude: -4.4331 },
  { city: 'Stuttgart', name: 'Stuttgart Airport', iata: 'STR', country: 'Germany', destination_id: 159, latitude: 48.6899, longitude: 9.2219 },
  { city: 'Cologne', name: 'Cologne Bonn Airport', iata: 'CGN', country: 'Germany', destination_id: 160, latitude: 50.8659, longitude: 7.1427 },
  { city: 'Basel', name: 'EuroAirport Basel Mulhouse Freiburg', iata: 'BSL', country: 'Switzerland', destination_id: 161, latitude: 47.5983, longitude: 7.5218 }, // Also serves France (MLH) & Germany (EAP)
  { city: 'Rotterdam', name: 'Rotterdam The Hague Airport', iata: 'RTM', country: 'Netherlands', destination_id: 162, latitude: 51.9531, longitude: 4.4306 },
  { city: 'Krakow', name: 'John Paul II International Airport Kraków–Balice', iata: 'KRK', country: 'Poland', destination_id: 163, latitude: 50.0777, longitude: 19.7848 },
  { city: 'Reykjavik', name: 'Keflavík International Airport', iata: 'KEF', country: 'Iceland', destination_id: 164, latitude: 63.9850, longitude: -22.6056 },
  
  // Additional Asian Airports
  { city: 'Islamabad', name: 'Islamabad International Airport', iata: 'ISB', country: 'Pakistan', destination_id: 246, latitude: 33.5495, longitude: 72.8255 },
  { city: 'Colombo', name: 'Bandaranaike International Airport', iata: 'CMB', country: 'Sri Lanka', destination_id: 247, latitude: 7.1808, longitude: 79.8858 },
  { city: 'Dhaka', name: 'Hazrat Shahjalal International Airport', iata: 'DAC', country: 'Bangladesh', destination_id: 248, latitude: 23.8433, longitude: 90.3978 },
  { city: 'Kathmandu', name: 'Tribhuvan International Airport', iata: 'KTM', country: 'Nepal', destination_id: 249, latitude: 27.6966, longitude: 85.3592 },
  { city: 'Male', name: 'Velana International Airport', iata: 'MLE', country: 'Maldives', destination_id: 250, latitude: 4.1918, longitude: 73.5291 },
  { city: 'Phnom Penh', name: 'Phnom Penh International Airport', iata: 'PNH', country: 'Cambodia', destination_id: 251, latitude: 11.5466, longitude: 104.8441 },
  { city: 'Siem Reap', name: 'Siem Reap International Airport', iata: 'REP', country: 'Cambodia', destination_id: 252, latitude: 13.3669, longitude: 103.8128 }, // Note: REP is largely replaced by SAI
  { city: 'Siem Reap', name: 'Siem Reap–Angkor International Airport', iata: 'SAI', country: 'Cambodia', destination_id: 253, latitude: 13.5708, longitude: 104.0694 },
  { city: 'Yangon', name: 'Yangon International Airport', iata: 'RGN', country: 'Myanmar', destination_id: 254, latitude: 16.9073, longitude: 96.1332 },
  { city: 'Cebu', name: 'Mactan–Cebu International Airport', iata: 'CEB', country: 'Philippines', destination_id: 255, latitude: 10.3076, longitude: 123.9792 },
  { city: 'Medan', name: 'Kualanamu International Airport', iata: 'KNO', country: 'Indonesia', destination_id: 256, latitude: 3.6375, longitude: 98.8872 },
  { city: 'Surabaya', name: 'Juanda International Airport', iata: 'SUB', country: 'Indonesia', destination_id: 257, latitude: -7.3797, longitude: 112.7869 },
  { city: 'Da Nang', name: 'Da Nang International Airport', iata: 'DAD', country: 'Vietnam', destination_id: 258, latitude: 16.0438, longitude: 108.1994 },
  { city: 'Penang', name: 'Penang International Airport', iata: 'PEN', country: 'Malaysia', destination_id: 259, latitude: 5.2971, longitude: 100.2767 },
  { city: 'Kota Kinabalu', name: 'Kota Kinabalu International Airport', iata: 'BKI', country: 'Malaysia', destination_id: 260, latitude: 5.9372, longitude: 116.0510 },
  { city: 'Macau', name: 'Macau International Airport', iata: 'MFM', country: 'Macau', destination_id: 261, latitude: 22.1496, longitude: 113.5916 },
  { city: 'Ulaanbaatar', name: 'Chinggis Khaan International Airport', iata: 'UBN', country: 'Mongolia', destination_id: 262, latitude: 47.6483, longitude: 106.7688 }, // New airport replacing ULN
  { city: 'Tashkent', name: 'Tashkent International Airport', iata: 'TAS', country: 'Uzbekistan', destination_id: 263, latitude: 41.2575, longitude: 69.2811 },
  { city: 'Almaty', name: 'Almaty International Airport', iata: 'ALA', country: 'Kazakhstan', destination_id: 264, latitude: 43.3521, longitude: 77.0405 },
  { city: 'Nur-Sultan', name: 'Nursultan Nazarbayev International Airport', iata: 'NQZ', country: 'Kazakhstan', destination_id: 265, latitude: 51.0222, longitude: 71.4670 }, // Formerly Astana (TSE)
  { city: 'Bishkek', name: 'Manas International Airport', iata: 'FRU', country: 'Kyrgyzstan', destination_id: 266, latitude: 43.0613, longitude: 74.4776 },
  { city: 'Dushanbe', name: 'Dushanbe International Airport', iata: 'DYU', country: 'Tajikistan', destination_id: 267, latitude: 38.5433, longitude: 68.8250 },
  { city: 'Ashgabat', name: 'Ashgabat International Airport', iata: 'ASB', country: 'Turkmenistan', destination_id: 268, latitude: 38.0614, longitude: 58.3609 },
  { city: 'Baku', name: 'Heydar Aliyev International Airport', iata: 'GYD', country: 'Azerbaijan', destination_id: 269, latitude: 40.4675, longitude: 50.0467 },
  { city: 'Tbilisi', name: 'Tbilisi International Airport', iata: 'TBS', country: 'Georgia', destination_id: 270, latitude: 41.6692, longitude: 44.9547 },
  { city: 'Yerevan', name: 'Zvartnots International Airport', iata: 'EVN', country: 'Armenia', destination_id: 271, latitude: 40.1472, longitude: 44.3959 },
  { city: 'Tehran', name: 'Imam Khomeini International Airport', iata: 'IKA', country: 'Iran', destination_id: 272, latitude: 35.4161, longitude: 51.1522 },
  { city: 'Muscat', name: 'Muscat International Airport', iata: 'MCT', country: 'Oman', destination_id: 273, latitude: 23.5933, longitude: 58.2844 },
  { city: 'Kuwait City', name: 'Kuwait International Airport', iata: 'KWI', country: 'Kuwait', destination_id: 274, latitude: 29.2267, longitude: 47.9689 },
  { city: 'Manama', name: 'Bahrain International Airport', iata: 'BAH', country: 'Bahrain', destination_id: 275, latitude: 26.2708, longitude: 50.6336 },

  // Oceania (Adding a few)
  { city: 'Sydney', name: 'Sydney Kingsford Smith Airport', iata: 'SYD', country: 'Australia', destination_id: 301, latitude: -33.9461, longitude: 151.1772 },
  { city: 'Melbourne', name: 'Melbourne Airport', iata: 'MEL', country: 'Australia', destination_id: 302, latitude: -37.6733, longitude: 144.8433 },
  { city: 'Brisbane', name: 'Brisbane Airport', iata: 'BNE', country: 'Australia', destination_id: 303, latitude: -27.3842, longitude: 153.1175 },
  { city: 'Auckland', name: 'Auckland Airport', iata: 'AKL', country: 'New Zealand', destination_id: 304, latitude: -37.0082, longitude: 174.7917 },
  { city: 'Nadi', name: 'Nadi International Airport', iata: 'NAN', country: 'Fiji', destination_id: 305, latitude: -17.7554, longitude: 177.4434 },

  // North America (Adding a few)
  { city: 'New York', name: 'John F. Kennedy International Airport', iata: 'JFK', country: 'USA', destination_id: 401, latitude: 40.6413, longitude: -73.7781 },
  { city: 'Los Angeles', name: 'Los Angeles International Airport', iata: 'LAX', country: 'USA', destination_id: 402, latitude: 33.9416, longitude: -118.4085 },
  { city: 'Chicago', name: 'O Hare International Airport', iata: 'ORD', country: 'USA', destination_id: 403, latitude: 41.9742, longitude: -87.9073 },
  { city: 'Toronto', name: 'Toronto Pearson International Airport', iata: 'YYZ', country: 'Canada', destination_id: 404, latitude: 43.6777, longitude: -79.6248 },
  { city: 'Vancouver', name: 'Vancouver International Airport', iata: 'YVR', country: 'Canada', destination_id: 405, latitude: 49.1939, longitude: -123.1844 },
  { city: 'Mexico City', name: 'Mexico City International Airport', iata: 'MEX', country: 'Mexico', destination_id: 406, latitude: 19.4363, longitude: -99.0721 },

  // South America
  { city: 'São Paulo', name: 'São Paulo/Guarulhos International Airport', iata: 'GRU', country: 'Brazil', destination_id: 501, latitude: -23.4356, longitude: -46.4731 },
  { city: 'Rio de Janeiro', name: 'Rio de Janeiro/Galeão International Airport', iata: 'GIG', country: 'Brazil', destination_id: 502, latitude: -22.8100, longitude: -43.2506 },
  { city: 'Bogotá', name: 'El Dorado International Airport', iata: 'BOG', country: 'Colombia', destination_id: 503, latitude: 4.7016, longitude: -74.1469 },
  { city: 'Lima', name: 'Jorge Chávez International Airport', iata: 'LIM', country: 'Peru', destination_id: 504, latitude: -12.0219, longitude: -77.1143 },
  { city: 'Santiago', name: 'Arturo Merino Benítez International Airport', iata: 'SCL', country: 'Chile', destination_id: 505, latitude: -33.3930, longitude: -70.7858 },
  { city: 'Buenos Aires', name: 'Ministro Pistarini International Airport', iata: 'EZE', country: 'Argentina', destination_id: 506, latitude: -34.8222, longitude: -58.5358 },
  { city: 'Caracas', name: 'Simón Bolívar International Airport', iata: 'CCS', country: 'Venezuela', destination_id: 507, latitude: 10.6031, longitude: -66.9905 },
  { city: 'Quito', name: 'Mariscal Sucre International Airport', iata: 'UIO', country: 'Ecuador', destination_id: 508, latitude: -0.1132, longitude: -78.3575 },

  // Africa
  { city: 'Johannesburg', name: 'O. R. Tambo International Airport', iata: 'JNB', country: 'South Africa', destination_id: 601, latitude: -26.1392, longitude: 28.2460 },
  { city: 'Cape Town', name: 'Cape Town International Airport', iata: 'CPT', country: 'South Africa', destination_id: 602, latitude: -33.9648, longitude: 18.6017 },
  { city: 'Cairo', name: 'Cairo International Airport', iata: 'CAI', country: 'Egypt', destination_id: 603, latitude: 30.1219, longitude: 31.4056 },
  { city: 'Lagos', name: 'Murtala Muhammed International Airport', iata: 'LOS', country: 'Nigeria', destination_id: 604, latitude: 6.5774, longitude: 3.3211 },
  { city: 'Nairobi', name: 'Jomo Kenyatta International Airport', iata: 'NBO', country: 'Kenya', destination_id: 605, latitude: -1.3192, longitude: 36.9278 },
  { city: 'Addis Ababa', name: 'Bole International Airport', iata: 'ADD', country: 'Ethiopia', destination_id: 606, latitude: 8.9779, longitude: 38.7993 },
  { city: 'Casablanca', name: 'Mohammed V International Airport', iata: 'CMN', country: 'Morocco', destination_id: 607, latitude: 33.3675, longitude: -7.5899 },
  { city: 'Algiers', name: 'Houari Boumediene Airport', iata: 'ALG', country: 'Algeria', destination_id: 608, latitude: 36.6910, longitude: 3.2154 },
  { city: 'Accra', name: 'Kotoka International Airport', iata: 'ACC', country: 'Ghana', destination_id: 609, latitude: 5.6052, longitude: -0.1667 },
  { city: 'Mauritius', name: 'Sir Seewoosagur Ramgoolam International Airport', iata: 'MRU', country: 'Mauritius', destination_id: 610, latitude: -20.4302, longitude: 57.6836 },
];

function getRandomDestinationId() {
  return Math.floor(Math.random() * 999) + 1;
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedCitiesWithAirports = async () => {
  try {
    await CityAirport.deleteMany();
    await CityAirport.insertMany(cityAirports);
    console.log('Successfully seeded city airports');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding city airports:', error);
    process.exit(1);
  }
};

const seedDB = async () => {
  await connectDB();
  await seedCitiesWithAirports();
};

seedDB();