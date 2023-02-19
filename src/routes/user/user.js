const express = require('express')
const router = express.Router();
const userController = require('../../controller/user/user')
const upload = require('../../middleware/upload');

router.post('/register', userController.REGISTER)
router.post('/login', userController.LOGIN)
router.delete('/delete-user', userController.DELETE_USER)

module.exports = router