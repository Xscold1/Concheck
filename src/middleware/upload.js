const multer = require('multer')

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

module.exports = multer({ storage: fileStorageEngine, limits: { fieldSize: 10 * 1024 * 1024 }, });
