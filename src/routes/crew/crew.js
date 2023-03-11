const express = require('express')
const router = express.Router();
const crewController = require('../../controller/crew/crew')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.put('/update-crew-account-details/:crewId',auth,upload.single('imageUrl'), crewController.UPDATE_CREW_ACCOUNT_DETAILS)
router.get('/get-crew-by-id/:crewId',auth, crewController.GET_CREW_BY_ID)
router.get('/get-dtr-by-id/:crewId',auth, crewController.GET_DTR_BY_CREW_ID)
router.get('/download-dtr/:crewId',auth, crewController.DOWNLOAD_DTR)
router.post('/crew-timein/:crewId',auth, crewController.TIMEIN)
router.post('/crew-timeout/:crewId',auth, crewController.TIMEOUT)


module.exports = router