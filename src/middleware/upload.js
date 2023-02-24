const multer = require('multer')
const cloudinary = require('../utils/cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    allowedFormats: ['jpg', 'png', 'jpeg'],
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  
const upload = multer({ storage: storage });
module.exports = upload
  
