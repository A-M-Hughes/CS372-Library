const express = require('express');
const booksApiController = require('../controllers/booksApi');

//API Middleware
const verifyToken = require('../helpers/verify');

//Router initialisation
const router = express.Router();

//Routes

//Get featured books.
router.get('/featured', verifyToken, booksApiController.featured);

//Get work information from a specified Open Library ID (OLID).
//The ID MUST end with a 'W'.
router.get('/works/:id', verifyToken, booksApiController.workInformation);

//Get book information from a specified Open Library ID (OLID).
//The ID MUST end with an 'M'.
router.get('/books/:id', verifyToken, booksApiController.bookInformation);

//Search OpenLibrary for a book. The query can be a book title, ISBN-10, ISBN-13, or OLID.
router.get('/searchBooks/:query', verifyToken, booksApiController.searchBooks);
router.get('/searchBooks/:query/:page', verifyToken, booksApiController.searchBooks);

module.exports = router;