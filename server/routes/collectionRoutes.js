const express = require('express');
const collectionController = require('../controllers/bookCollection');

//API Middleware
const verifyToken = require('../helpers/verify');

//Router initialisation
const router = express.Router();

//Routes

//POST to add book to collection
router.post('/addBook', verifyToken, collectionController.addBook);
//DELETE to remove book from collection
router.delete('/deleteBook', verifyToken, collectionController.deleteBook);
//GET to retrieve books from collection
router.get('/getBooks', verifyToken, collectionController.getBooks);

module.exports = router;