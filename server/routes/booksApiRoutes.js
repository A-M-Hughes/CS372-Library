const express = require('express');
const booksApiController = require('../controllers/booksApi');

//API Middleware
const verifyToken = require('../helpers/verify');

//Router initialisation
const router = express.Router();

//Routes

//get featured books
router.get('/featured', verifyToken, booksApiController.featured);

//get book information from a specified Open Library ID (OLID)
router.get('/information/:id', verifyToken, booksApiController.workInformation);

module.exports = router;