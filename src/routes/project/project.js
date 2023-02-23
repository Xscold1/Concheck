const express = require('express')
const router = express.Router();
const projectController = require('../../controller/project/project')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

// router.post('/create-project', auth , upload.single('image') ,projectController.CREATE_PROJECT)
router.post('/add-crew-account', auth,projectController.ADD_CREW_ACCOUNT)
router.post('/add-task',auth, projectController.ADD_TASK)
router.get('/get-all-task/:_id', auth,projectController.GET_ALL_TASK)
router.post('/add-daily-report', auth,projectController.ADD_DAILY_REPORT)
router.post('/find-image-and-update-caption', auth,projectController.FIND_IMAGE_AND_UPDATE_CAPTION)
router.post('/upload-image/:_id', auth , upload.array('imageUrl', 10),projectController.UPLOAD_IMAGE)
router.get('/get-project-by-id/:_id', auth,projectController.GET_PROJECT_BY_ID)
router.get('/get-all-crew', auth,projectController.GET_ALL_CREW)
//router.post('/upload-image', projectController.UPLOAD_IMAGE)


module.exports = router