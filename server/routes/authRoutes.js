const express = require('express');
const authController = require('../controllers/authenication');

//API MIDDLEWARE
const verifyToken = require('../helpers/verify');

//Router initialisation
const router = express.Router();

//routes
router.get('/auth/test', verifyToken, authController.test);

//POST REGISTER
router.post('/register', authController.register);

//POST TOKEN
router.post('/auth/token', verifyToken, authController.token);

//POST Confirm Email!
router.post('/auth/confirmEmail', verifyToken, authController.confirmEmailToken);

//POST Login
router.post('/login', authController.login);

module.exports = router;