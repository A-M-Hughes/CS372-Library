const express = require('express');
const authController = require('../controllers/recommendations');

//API MIDDLEWARE
const verifyToken = require('../helpers/verify');

//Router initialisation
const router = express.Router();

//routes
//POST creates a recommendation(s)
router.post('/createRecommendations', verifyToken, authController.createRecommendations);
//GET gets the recommendations 
router.get('/getRecommendations', verifyToken, authController.getRecommendations);
//DELETE delete a recommendation
router.delete('/deleteRecommendation', verifyToken, authController.deleteRecommendation);

module.exports = router;