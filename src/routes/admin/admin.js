const express = require('express')
const router = express.Router();
const adminController = require('../../controller/admin/admin')
const upload = require('../../middleware/upload');

router.post('/create-admin', adminController.CREATE_ADMIN)


module.exports = router