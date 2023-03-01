const express = require('express')
const router = express.Router();
const adminController = require('../../controller/admin/admin')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/add-admin-account',auth, adminController.ADD_ADMIN_ACCOUNT)
router.post('/add-company-account', auth,upload.single('imageUrl') , adminController.ADD_COMPANY_ACCOUNT)
router.get('/get-all-admin-account',auth, adminController.GET_ALL_ADMIN_ACCOUNT)
router.get('/get-all-company-account', auth,adminController.GET_ALL_COMPANY_ACCOUNT)
router.put('/edit-company-account/:companyId', auth ,upload.single('imageUrl') , adminController.EDIT_COMPANY_ACCOUNT)
router.put('/edit-admin-account/:userId', auth,adminController.EDIT_ADMIN_ACCOUNT)
router.get('/get-admin-account-by-id/:userId', auth,adminController.GET_ADMIN_ACCOUNT_BY_ID)
router.get('/get-company-account-by-id/:companyId', auth,adminController.GET_COMPANY_ACCOUNT_BY_ID)
router.delete('/delete-company/:companyId', auth,adminController.DELETE_COMPANY_ACCOUNT)
module.exports = router