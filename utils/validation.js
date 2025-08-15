// utils/validation.js
const { parsePhoneNumberFromString } = require('libphonenumber-js');

function isGmailAddress(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === 'gmail.com' || domain === 'googlemail.com';
}

function isValidIndianMobile(number) {
  const phoneNumber = parsePhoneNumberFromString(number, 'IN');
  return phoneNumber?.isValid() && phoneNumber.country === 'IN';
}

module.exports = { isGmailAddress, isValidIndianMobile };