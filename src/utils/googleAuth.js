const {google} = require('googleapis');

const keys = require ('../../keys.json');
const client = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
);

module.exports = client