/* This file contains a schema for a user in the DB, it may not be the final user, just a schema to 
demostrate the backend functionality with creating and managing users */
const mongoose = require('mongoose');

//This schema is for the user, has an email, password, emailConfirmed, emailToken(for confirming email), and refresh tokens
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        min: 6,
        max: 25
    },
    password: {
        type: String,
        required: true,
        min: 10,
        max: 255
    },
    emailConfirmed: {
        type: Boolean,
        required: true,
        default: true
    },
    emailToken: {
        type: String
    },
    security: {
        tokens: [{
            refreshToken: String,
            createdAt: Date
        }],
        passwordReset: {
            token: {
                type: String,
                default: null
            },
            provisionalPassword: {
                type: String,
                default: null
            },
            expiry: {
                type: Date,
                default: null
            },
        },
        changeEmail: {
            token: {
                type: String,
                default: null
            },
            provisionalEmail: {
                type: String,
                default: null,
            },
            expiry: {
                type: String,
                default: null,
            },
        }
    },
    bookLists: {
        ownedBooks: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ownedBooks'
        },
        recommendations: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'recommendations'
        }
    }
});

module.exports = mongoose.model('User', userSchema);