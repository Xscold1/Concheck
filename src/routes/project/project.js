const express = require('express')
const router = express.Router();
const projectController = require('../../controller/project/project')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/add-crew-account/:projectId', auth,projectController.ADD_CREW_ACCOUNT)
router.post('/add-task/:projectId',auth, projectController.ADD_TASK)
router.post('/add-daily-report/:projectId', auth,projectController.ADD_DAILY_REPORT)
router.post('/upload-image/:projectId', auth , upload.array('imageUrl'),projectController.UPLOAD_IMAGE)
router.get('/get-project-by-id/:projectId', auth,projectController.GET_PROJECT_BY_ID)
router.get('/get-all-crew-by-project/:projectId', auth,projectController.GET_ALL_CREW_BY_PROJECT)
router.get('/get-daily-report-by-id/:dailyReportId', auth,projectController.GET_DAILY_REPORT_BY_ID)
router.get('/get-all-task/:projectId', auth,projectController.GET_ALL_TASK)
router.get('/get-task-by-id/:taskId', auth,projectController.GET_TASK_BY_ID)
router.get('/get-all-daily-report-by-project/:projectId', auth,projectController.GET_ALL_DAILY_REPORT_BY_PROJECT)
router.get('/get-image-by-project/:projectId', auth,projectController.GET_IMAGE_BY_PROJECT_ID)
router.get('/get-image-by-id/:imageId', auth,projectController.GET_IMAGE_BY_ID)
router.get('/get-daily-report-by-date/:projectId/:date', auth,projectController.GET_DAILY_REPORT_BY_DATE)
router.put('/edit-task/:taskId', auth,projectController.EDIT_TASK)
router.put('/edit-daily-report/:dailyReportId', auth,projectController.EDIT_DAILY_REPORT)
router.put('/edit-image/:imageId', auth,projectController.EDIT_IMAGE)
router.delete('/delete-task/:taskId' , auth, projectController.DELETE_TASK)
router.delete('/delete-daily-report/:dailyReportId' , auth, projectController.DELETE_DAILY_REPORT)
router.delete('/delete-crew/:crewId' , auth, projectController.DELETE_CREW)
router.delete('/delete-image-by-id/:imageId' , auth, projectController.DELETE_IMAGE_BY_ID)
router.put('/update-task/:taskId' , auth , projectController.UPDATE_TASK)
router.get('/download-weekly-report/:projectId' , auth , projectController.DOWNLOAD_WEEKLY_REPORT)
router.get('/download-project-summary/:projectId' , auth , projectController.DOWNLOAD_SUMMARY)

module.exports = router