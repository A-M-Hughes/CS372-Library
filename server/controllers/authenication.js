/* This is the authenication file that will handle the business logic needed for the aunthenication of users */

const User = require('../models/user');
const JWT = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../helpers/validation');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

/*  This is the register function, it currently only needs an "email" & "password" in the request body to create a
    a user. This function should only be used with POST requests, and on a successful creation, sends a json file that
    indicates success, with the user information such as JWT access token and refresh token*/
const register = async (req, res) => {
    try {   
        const { error } = registerSchema.validate(req.body, { abortEarly: false }); //Ensure request body is in the proper format

        if (error) { //If there was an error validating then send an error
            res.status(400).json({ status: 400, message: 'InputError', errors: error.details, original: error._original });
        } else {
            //hash the password into the database
            const salt = await bcrypt.genSalt(10); //wait for the salt to be generated
            const hashedPassword = await bcrypt.hash(req.body.password, salt); //wait for the hash to be generated

            //create new user instance with the provided information
            const user = new User({
                email: req.body.email,
                password: hashedPassword,
                emailConfirmed: false,
                emailToken: uuidv4(),
                security: {
                    tokens: [],
                    passwordReset: {
                        token: null,
                        provisionalPassword: null,
                        expiry: null
                    }
                }
            });

            //attempt save user into db
            await user.save()

            //create JWT token
            const access_token = generateAccessToken(user.id, user.email);

            //create refresh token
            const refreshToken = generateRefreshToken(user.id, user.email);

            await User.updateOne({ email: user.email }, { //update with the refresh tokens
                $push: {
                    'security.tokens': {
                        refreshToken: refreshToken,
                        createdAt: new Date(),
                    },
                },
            });

            await sendEmailConfirmation(user); //send email to the user

            res.status(200).header().json({ //if there has been no errors, send success status to user
                success: {
                    status: 200,
                    message: 'REGISTER_SUCCESS',
                    accessToken: access_token,
                    refreshToken: refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                    }
                }
            });
        }
    } catch (error) { //Catch the errors
        let errMessage;

        if (error.keyPattern.email === 1) { //If email exists send that as the message
            errMessage = 'Email Exists'
        } else {
            errMessage = err;
        }

        res.status(400).json({ error: { status: 400, message: errMessage } })
    }
}

/*  This is the login function, it assumes that the request is sent with an "email" & "password" in the request body.
    This function should only be used with POST requests, if the request is successful it will respond with a json 
    success message that includes a JWT access token and refresh token */
const login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body); //validate that the login information is valid, or store an error

        if (error) { //If there is an error send an error message
            res.status(400).json({
                status: 400,
                message: 'Input Error',
                errors: error.details,
                original: error._original
            });
        } else { //Otherwise there is no error so continue 
            const user = await User.findOne({ email: req.body.email }); //Queries database for user

            //check that the email exists
            if (user) { 
                //Check if the entered password matches the user's hashed password
                const validatePassword = await bcrypt.compare(req.body.password, user.password);

                if (validatePassword) {
                    //Generate Access and refresh tokens
                    const accessToken = generateAccessToken(user.id, user.email);
                    const refreshToken = generateRefreshToken(user.id, user.email);

                    if (await addRefreshToken(user, refreshToken)) { //Attempts to add refresh token to database
                        res.status(200).json({
                            success: {
                                status: 200,
                                message: "Login Success",
                                accessToken: accessToken,
                                refreshToken: refreshToken
                            }
                        })
                    } else { //If adding the refresh token fails, send a server error, user can't log in
                        res.status(500).json({ error: { status: 500, message: 'Server Error' } });
                    }
                } else { //If the password is invalid
                    res.status(403).json({ error: { status: 403, message: "Invalid Password" } });
                }
            } else { //If a user could not be found
                res.status(403).json({ error: { status: 403, message: "Invalid Email" } });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: { status: 400, message: "Bad Request" } });
    }
}

/*  This function generates a new JWT access Token after being given a valid refresh token from the user */
const token = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken; //grabs refresh token from request

         
        try { //decode the JWT refresh token, and then get the email and use it to get the existing tokens from the db
            const decodeRefreshToken = JWT.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN);
            const user = await User.findOne({ email: decodeRefreshToken.email });
            const existingTokens = await user.security.tokens;

            
            if (existingTokens.some(token => token.refreshToken === refreshToken)) {//check if the refresh token is in the document
                //generate new access token because the refresh token was valid
                const access_token = generateAccessToken(user.id, user.email);

                res.status(200).header().json({ //Send success with the new refresh token
                    success: {
                        status: 200,
                        message: 'Access_Token_Generated',
                        accessToken: access_token
                    },
                });
            } else {
                res.status(401).json({ error: { status: 401, message: 'Invalid Refresh Token' } });
            }

        } catch (error) {
            res.status(401).json({ error: { status: 401, message: 'Invalid Refresh Token' } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: 'Bad Request' } });
    }
}

/*  This method requires the JWT access token to be in the header and an email token in the request body, if the email 
    token matches the one in the database, then sents the email confirmed field to true */
const confirmEmailToken = async (req, res) => {
    try {
        const emailToken = req.body.emailToken; //tries to get the email token from the body

        if (emailToken !== null) { //If it exists, get the access token from the header, and decode it
            const accessToken = req.header('Authorization').split(' ')[1];
            const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);

            //check if user exists
            const user = await User.findOne({ email: decodeAccessToken.email });

            //check if email is already confirmed
            if (!user.emailConfirmed) {
                //check if provided email token matches the one in the user's record
                if (emailToken === user.emailToken) { //If there is a match, then success
                    await User.updateOne({ email: decodeAccessToken.email }, { $set: { emailConfirmed: true, emailToken: null } })
                    res.status(200).json({ success: { status: 200, message: "Email Confirmed" } }); 
                } else { //Otherwise the email token is invalid
                    res.status(401).json({ error: { status: 401, message: "Invalid email token" } });
                }
            } else { 
                res.status(401).json({ error: { status: 401, message: "Email already confirmed" } });
            }
        } else {
            res.status(400).json({ error: { status: 400, message: "Bad request" } });
        }

    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "Bad Request" } });
    }
}
/*This will just act as a test for the authenicated users, i.e. if the user is authenicated then they
should be able to access this route and seed GOOD + their email*/
const test = async (req, res) => {
    try {
        req.user
        res.send("GOOD" + req.user.email);
    }
    catch {
        res.send('Error');
    }
}

//Helper methods

//Email Helper Methods
const sendEmailConfirmation = async (user) => {
    let transport = nodemailer.createTransport({ //Sets up the email account by logining in
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let mailOptions = { //Sets the mail options
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Confirmation Email', //This doesn't actually send a working link, we need to coordinate this between teh frontend and backend
        text: `Click link to confirm your email: http://TEMPLINK!-NEED-TO-SET-UP-FRONTEND!${user.emailToken}`
    };

    await transport.sendMail(mailOptions, function (error, info) { //sends the mail to the user
        if (error) {
            console.log(error);
        } else {
            console.log(info);
        }
    });
}

//Token Helper Methods

/*  This method takes an id and email, and generates an JWT access token using the access token key and expiry env vars
    it also has a uName parameter that isn't used just in case we want to use username authenication instead */
const generateAccessToken = (id, email, uName) => {
    let items = {
        _id: id,
        email: email,
    }
    return JWT.sign(items, process.env.SECRET_ACCESS_TOKEN, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
}

/*  This method takes an id and email, and generates an JWT refresh token using the refresh token key and expiry env vars
    it also has a uName parameter that isn't used just in case we want to use username authenication instead */
const generateRefreshToken = (id, email, uName) => {
    let items = {
        _id: id,
        email: email,
    }
    return JWT.sign(items, process.env.SECRET_REFRESH_TOKEN, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
}

/*  This method takes a user email and a refresh token and adds the refresh token to the user's db record */
const addRefreshToken = async (user, refreshToken) => {
    try {
        const existingRefreshTokens = user.security.tokens;

        //check if there is less than X refresh tokens
        if (existingRefreshTokens.length < 5) {
            await User.updateOne({ email: user.email }, {
                $push: {
                    'security.tokens': {
                        refreshToken: refreshToken,
                        createdAt: new Date()
                    },
                },
            });
        } else {
            //Otherwise remove the last token 
            await User.updateOne({ email: user.email }, {
                $pull: {
                    'security.tokens': {
                        _id: existingRefreshTokens[0]._id,
                    },
                },
            });

            //push the new token
            await User.updateOne({ email: user.email }, {
                $push: {
                    'security.tokens': {
                        refreshToken: refreshToken,
                        createdAt: new Date(),
                    },
                },
            });
        }
        return true;
    } catch (error) {
        return false;
    }
}


module.exports = {
    test, register, token,
    confirmEmailToken, login,
};