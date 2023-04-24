const {google} = require('googleapis');

const keyPath = require ('../../keys.json');
const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
module.exports = auth 