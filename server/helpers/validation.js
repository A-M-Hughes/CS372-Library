/* This file uses the joi module to validate the data send to this express server, and
 ensures it conforms to the user.js schema in the models folder*/
const Joi = require('joi');

//Validation for the register request, ensures password is long enough and email is an email
const registerSchema = Joi.object({
    "email": Joi.string().min(6).max(25).email().required(),
    "name": Joi.string().min(2).max(25).required(),
    "password": Joi.string().min(10).max(255).required(),
});

//Validation for the login schema
const loginSchema = Joi.object({
    "email": Joi.string().min(6).max(25).email().required(),
    "password": Joi.string().min(10).max(255).required(),
});

//Validation for the email schema
const emailSchema = Joi.object({
    "email": Joi.string().min(6).max(25).email().required(),
});

//Validation for add book
const addBookSchema = Joi.object({
    "title": Joi.string().min(2).max(80).required(),
    "author": Joi.string().min(2).max(80).required(),
    "coverLink": Joi.string().required(),
    "pageNumber": Joi.string().required(),
    "publishedYear": Joi.string().required(),
    "rating": Joi.string().required(),
    "genres":  Joi.array().items(
        Joi.string()
    ),
});

const genresSchema = Joi.object({
    "genre": Joi.string(),
    "genres": Joi.array().items(
        Joi.string()
    )
});

module.exports = {
    registerSchema,
    loginSchema,
    emailSchema,
    addBookSchema,
    genresSchema
};