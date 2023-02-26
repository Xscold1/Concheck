const express = require('express')
const router = express.Router();
const userController = require('../../controller/user/user')
const auth = require('../../middleware/auth');
const upload = require('../../middleware/upload');

//router.post('/register', userController.REGISTER)
router.post('/login', userController.LOGIN)

module.exports = router