const express = require('express')
const router = express.Router();
const adminController = require('../../controller/admin/admin')
const upload = require('../../middleware/upload');

router.post('/add-admin-account', adminController.ADD_ADMIN_ACCOUNT)
router.post('/add-company-account', upload.single('imageUrl') , adminController.ADD_COMPANY_ACCOUNT)
router.get('/get-all-admin-account', adminController.GET_ALL_ADMIN_ACCOUNT)
router.get('/get-all-company-account', adminController.GET_ALL_COMPANY_ACCOUNT)
router.put('/edit-company-account', upload.single('imageUrl') , adminController.EDIT_COMPANY_ACCOUNT)
router.put('/edit-admin-account', adminController.EDIT_ADMIN_ACCOUNT)

module.exports = router