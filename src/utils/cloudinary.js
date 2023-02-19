const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

cloudinary.config({ 
    cloud_name: 'diwlgnbqc', 
    api_key: '548794665558367', 
    api_secret: 'HFivTHAE97dsdc-KOy6snt95tj4' 
  });

module.exports = cloudinary