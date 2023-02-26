const express = require('express')
const router = express.Router();
const adminController = require('../../controller/admin/admin')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/add-admin-account', auth, adminController.ADD_ADMIN_ACCOUNT)
router.post('/add-company-account', auth,upload.single('imageUrl') , adminController.ADD_COMPANY_ACCOUNT)
router.get('/get-all-admin-account',auth, adminController.GET_ALL_ADMIN_ACCOUNT)
router.get('/get-all-company-account', auth,adminController.GET_ALL_COMPANY_ACCOUNT)
router.put('/edit-company-account/:companyUserId', auth,upload.single('imageUrl') , adminController.EDIT_COMPANY_ACCOUNT)
router.put('/edit-admin-account/:adminUserId', auth,adminController.EDIT_ADMIN_ACCOUNT)
router.get('/get-admin-account-by-id/:adminUserId', auth,adminController.GET_ADMIN_ACCOUNT_BY_ID)
router.get('/get-company-account-by-id/:companyUserId', auth,adminController.GET_COMPANY_ACCOUNT_BY_ID)

module.exports = router