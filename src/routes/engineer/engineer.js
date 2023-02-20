const express = require('express')
const router = express.Router();
const engineerController = require('../../controller/engineer/engineer')

router.post('/create-project', engineerController.CREATE_PROJECT)
router.put('/edit-project', engineerController.EDIT_PROJECT)
router.get('/get-all-project', engineerController.GET_ALL_PROJECT)
router.delete('/delete-project', engineerController.DELETE_PROJECT)

module.exports = router