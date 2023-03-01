const express = require('express')
const router = express.Router();
const engineerController = require('../../controller/engineer/engineer')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/create-project/:engineerId', auth, upload.single('imageUrl'), engineerController.CREATE_PROJECT)
router.put('/edit-project/:_id', auth , upload.single('imageUrl') ,engineerController.EDIT_PROJECT)
router.get('/get-all-project/:projectEngineer', auth, engineerController.GET_ALL_PROJECT)
router.delete('/delete-project/:_id', auth,engineerController.DELETE_PROJECT)

module.exports = router