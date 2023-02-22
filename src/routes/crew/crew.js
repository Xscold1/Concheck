const express = require('express')
const router = express.Router();
const crewController = require('../../controller/crew/crew')
const upload = require('../../middleware/upload');

router.put('/update-crew-account-details',upload.single('imageUrl'), crewController.UPDATE_CREW_ACCOUNT_DETAILS)


module.exports = router