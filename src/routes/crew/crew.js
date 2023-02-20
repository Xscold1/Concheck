const express = require('express')
const router = express.Router();
const crewController = require('../../controller/crew/crew')

router.put('/update-crew-account-details', crewController.UPDATE_CREW_ACCOUNT_DETAILS)


module.exports = router