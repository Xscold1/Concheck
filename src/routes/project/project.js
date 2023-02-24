const express = require('express')
const router = express.Router();
const projectController = require('../../controller/project/project')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/add-crew-account', auth,projectController.ADD_CREW_ACCOUNT)
router.post('/add-task',auth, projectController.ADD_TASK)
router.get('/get-all-task/:_id', auth,projectController.GET_ALL_TASK)
router.post('/add-daily-report', auth,projectController.ADD_DAILY_REPORT)
router.post('/upload-image/:_id', auth , upload.array('imageUrl'),projectController.UPLOAD_IMAGE)
router.get('/get-project-by-id/:_id', auth,projectController.GET_PROJECT_BY_ID)
router.get('/get-all-crew', auth,projectController.GET_ALL_CREW)


module.exports = router