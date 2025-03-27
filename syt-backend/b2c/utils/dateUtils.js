const { DateTime } = require('luxon');

const convertToIST = (date) => {
  return DateTime.fromJSDate(new Date(date)).setZone('Asia/Kolkata');
};

const formatISTDate = (date) => {
  return convertToIST(date).toFormat('yyyy-MM-dd');
};

const formatISTDateTime = (date) => {
  return convertToIST(date).toISO();
};

const getDifferenceInDays = (startDate, endDate) => {
  const start = DateTime.fromISO(startDate).setZone('Asia/Kolkata').startOf('day');
  const end = DateTime.fromISO(endDate).setZone('Asia/Kolkata').startOf('day');
  return Math.ceil(end.diff(start, 'days').days);
};

module.exports = {
  convertToIST,
  formatISTDate,
  formatISTDateTime,
  getDifferenceInDays,
};