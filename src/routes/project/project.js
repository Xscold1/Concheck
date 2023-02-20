const express = require('express')
const router = express.Router();
const projectController = require('../../controller/project/project')
const upload = require('../../middleware/upload');

// router.post('/create-project', auth , upload.single('image') ,projectController.CREATE_PROJECT)
router.post('/add-crew-account', projectController.ADD_CREW_ACCOUNT)

module.exports = router