const bookList = require('../models/bookList');
const User = require('../models/user');
const JWT = require('jsonwebtoken');
const { addBookSchema } = require('../helpers/validation');

/*  This function handles the book addition functionality for users, it should be used with POST requests and takes
    information about the book in the body

    The request body requires the following fields : 
    title (String, the title of the book) - author (String, author of the book) - pageNumber (String, number of pages in the book (String for simplicity as it doesn't need operations done on it))
    ISBN (String, the ISBN of the book) - genres (Array of Strings, list of genres the book has) - coverLink (String, link to the openlibrary api for book image) 
    rating (String, the rating of the book (Out of 5)) - publishedYear (String, the year that the book was published (Not date for simplicity))
*/
const addBook = async (req, res) => {
    try {
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);

        //check if user exists
        const user = await User.findOne({ email: decodeAccessToken.email });

        if (user) {
            const userId = user._id;

            //validate the request body schema to ensure the request can be validated
            const { error } = addBookSchema.validate(req.body);
            if (error) {
                res.status(400).json({ error: { status: 400, message: 'INPUT_ERROR', errors: error.details, original: error._original } });
                return;
            }

            let existingBookList = user.bookLists.ownedBooks; //Grabs existing book collection list if exists

            //if there is no active mongodb record for this account's book list, create a new record
            if (!existingBookList) {
                let newBook = new bookList({
                    accountEmail: decodeAccessToken.email,
                    type: "collection",
                    books: [{
                        title: req.body.title,
                        author: req.body.author,
                        pageNumber: req.body.pageNumber,
                        ISBN: req.body.ISBN,
                        coverLink: req.body.coverLink,
                        genres: req.body.genres,
                        rating: req.body.rating,
                        publishedYear: req.body.publishedYear
                    }]
                });
                await newBook.save();
                var $set = { $set: {} }; 
                $set.$set['bookLists.ownedBooks'] = newBook._id;

                await User.findOneAndUpdate({ _id: userId }, $set);
            } else { //otherwise there exists a record with an array of books in the user's collection
                let newBook = {
                    title: req.body.title,
                    author: req.body.author,
                    pageNumber: req.body.pageNumber,
                    ISBN: req.body.ISBN,
                    coverLink: req.body.coverLink,
                    genres: req.body.genres,
                    rating: req.body.rating,
                    publishedYear: req.body.publishedYear
                };
                await bookList.updateOne({ _id: existingBookList }, {
                    $push: { //push new book to the array 
                        books: newBook,
                    }
                })
            }
            res.status(200).json({ success: { status: 200, message: 'BOOK_ADDED' } });
        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}



/*  This function handles the book deletion functionality for users, it should be used with DELETE requests and takes
    book object id in request body

    The request body requires the following fields : 
    bookID (String, the object id of the book object from the mongodb database that will be removed)
*/
const deleteBook = async (req, res) => {
    try {
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);

        
        const user = await User.findOne({ email: decodeAccessToken.email });
        let bookID = req.body.bookID;
        //check if user exists
        if (user) {
            if (!bookID) { //Check if bookID is in the request body
                res.status(400).json({ error: { status: 400, message: 'INPUT_ERROR', errors: error.details, original: error._original } });
                return;
            }

            let book = await bookList.findById(user.bookLists.ownedBooks);
            if (!book) { res.status(410).json({ error: { status: 410, message: "BOOK_LIST_NOT_FOUND", } }); return; }
            else {
                //If there is no error, get the number of books from the book list array and then remove an the selected book from the array
                let numBooks = book._doc.books.length;
                let selectedBook = book.books.pull(bookID);

                if (selectedBook.length == numBooks) { //Check that an element was removed, if not send error response
                    res.status(410).json({ error: { status: 410, message: "BOOK_NOT_FOUND", } });
                }
                else {
                    await book.save();
                    res.status(200).json({ succes: { status: 200, message: "BOOK_DELETED" } });
                }
            }

        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}

/*  This function handles the collection retrieval functionality for users, it should be used with GET requests and takes
    nothing in the request body
*/
const getBooks = async (req, res) => {
    try {
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);
        //get user
        const user = await User.findOne({ email: decodeAccessToken.email });

        if (user) {
            //get book list then return
            let books = await bookList.findById(user.bookLists.ownedBooks);
            
            res.status(200).json({ success: { status: 200, message: "BOOKS_FOUND", books: books.books } });

        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}


module.exports = {
    addBook, deleteBook, getBooks
};