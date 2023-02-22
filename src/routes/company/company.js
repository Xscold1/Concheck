const express = require('express')
const router = express.Router();
const companyController = require('../../controller/company/company')
const upload = require('../../middleware/upload');

router.post('/add-engineer-account', upload.single('imageUrl'),companyController.ADD_ENGINEER_ACCOUNT)
router.put('/edit-engineer-account', upload.single('imageUrl'), companyController.EDIT_ENGINEER_ACCOUNT)
router.get('/get-all-engineer-account', companyController.GET_ALL_ENGINEER_ACCOUNT)


module.exports = router