const express = require('express')
const router = express.Router();
const projectController = require('../../controller/project/project')
const upload = require('../../middleware/upload');

// router.post('/create-project', auth , upload.single('image') ,projectController.CREATE_PROJECT)
router.post('/add-crew-account', projectController.ADD_CREW_ACCOUNT)
router.post('/add-task', projectController.ADD_TASK)
router.post('/get-all-task', projectController.GET_ALL_TASK)
router.post('/add-daily-report', projectController.ADD_DAILY_REPORT)
//router.post('/upload-image', projectController.UPLOAD_IMAGE)


module.exports = router