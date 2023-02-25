const express = require('express')
const router = express.Router();
const companyController = require('../../controller/company/company')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/add-engineer-account/:_id', auth, upload.single('imageUrl'),companyController.ADD_ENGINEER_ACCOUNT)
router.put('/edit-engineer-account/:_id', auth,upload.single('imageUrl'), companyController.EDIT_ENGINEER_ACCOUNT)
router.get('/get-all-engineer-account', auth,companyController.GET_ALL_ENGINEER_ACCOUNT)
router.get('/get-engineer-account-by-id/:_id', auth,companyController.GET_ENGINEER_ACCOUNT_BY_ID)

module.exports = router