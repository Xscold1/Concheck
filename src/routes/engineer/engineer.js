const express = require('express')
const router = express.Router();
const engineerController = require('../../controller/engineer/engineer')
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/create-project', auth,upload.single('imageUrl'), engineerController.CREATE_PROJECT)
router.put('/edit-project', auth,upload.single('imageUrl') ,engineerController.EDIT_PROJECT)
router.get('/get-all-project', auth, engineerController.GET_ALL_PROJECT)
router.delete('/delete-project', auth,engineerController.DELETE_PROJECT)

module.exports = router