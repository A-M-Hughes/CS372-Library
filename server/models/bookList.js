const mongoose = require('mongoose');

const bookList = new mongoose.Schema({
    accountEmail: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    books: [{
        title: {
            type: String,
            required: true
        },
        author: [{
            type: String,
            required: true
        }],
        pageNumber: {
            type: String,
            required: true
        },
        coverLink: {
            type: String,
            required: false
        },
        genres: [
            {
                type: String,
            }
        ],
        rating: {
            type: String,
            required: true
        },
        publishedYear: {
            type: String,
            required: true
        },
    }]
})

module.exports = mongoose.model('bookList', bookList);