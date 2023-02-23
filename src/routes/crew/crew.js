const express = require('express')
const router = express.Router();
const crewController = require('../../controller/crew/crew')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.put('/update-crew-account-details',auth,upload.single('imageUrl'), crewController.UPDATE_CREW_ACCOUNT_DETAILS)


module.exports = router