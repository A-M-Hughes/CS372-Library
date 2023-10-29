/* This is the authenication file that will handle the business logic needed for the aunthenication of users */

const User = require('../models/user');
const JWT = require('jsonwebtoken');
const { registerSchema, loginSchema, emailSchema } = require('../helpers/validation');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const moment = require('moment');

/*  This is the register function, it currently only needs an "email" & "password" in the request body to create a
    a user. This function should only be used with POST requests, and on a successful creation, sends a json file that
    indicates success, with the user information such as JWT access token and refresh token*/
const register = async (req, res) => {
    try {   
        const { error } = registerSchema.validate(req.body, { abortEarly: false }); //Ensure request body is in the proper format

        if (error) { //If there was an error validating then send an error
            res.status(400).json({ status: 400, message: 'INPUT_ERROR', errors: error.details, original: error._original });
        } else {
            //hash the password into the database
            const salt = await bcrypt.genSalt(10); //wait for the salt to be generated
            const hashedPassword = await bcrypt.hash(req.body.password, salt); //wait for the hash to be generated

            //create new user instance with the provided information
            const user = new User({
                email: req.body.email,
                password: hashedPassword,
                name: req.body.name,
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
            await user.save();

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
            errMessage = 'EMAIL_EXISTS';
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
                message: 'INPUT_ERROR',
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
                                message: "LOGIN_SUCCESS",
                                accessToken: accessToken,
                                refreshToken: refreshToken
                            }
                        })
                    } else { //If adding the refresh token fails, send a server error, user can't log in
                        res.status(500).json({ error: { status: 500, message: 'SERVER_ERROR' } });
                    }
                } else { //If the password is invalid
                    res.status(403).json({ error: { status: 403, message: "INVALID_PASSWORD" } });
                }
            } else { //If a user could not be found
                res.status(403).json({ error: { status: 403, message: "INVALID_EMAIL" } });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
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
                        message: 'ACCESS_TOKEN_GENERATED',
                        accessToken: access_token
                    },
                });
            } else {
                res.status(401).json({ error: { status: 401, message: 'INVALID_REFRESH_TOKEN' } });
            }

        } catch (error) {
            res.status(401).json({ error: { status: 401, message: 'INVALID_REFRESH_TOKEN' } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: 'BAD_REQUEST' } });
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
                    await User.updateOne({ email: decodeAccessToken.email }, { $set: { emailConfirmed: true, emailToken: null } });
                    res.status(200).json({ success: { status: 200, message: "EMAIL_CONFIRMED" } }); 
                } else { //Otherwise the email token is invalid
                    res.status(401).json({ error: { status: 401, message: "INVALID_EMAIL_TOKEN" } });
                }
            } else { 
                res.status(401).json({ error: { status: 401, message: "EMAIL_ALREADY_CONFIRMED" } });
            }
        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }

    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}
/*This will just act as a test for the authenicated users, i.e. if the user is authenicated then they
should be able to access this route and seed GOOD + their email*/
const test = async (req, res) => {
    try {
        res.send("GOOD" + req.user.email);
    }
    catch {
        res.send('Error');
    }
}


/*  This method requires a provisionalPassword and email in the body, it causes an email to be sent to the user 
    which will then confirm the password change once the user visits that page. The password reset token will be 
    stored in the db and used as a url parameter of the link given to the user's email*/
const resetPassword = async (req, res) => {
    try {
        if (req.body.provisionalPassword.length >= 6 && req.body.provisionalPassword.length <= 255) {
            //Hash Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.provisionalPassword, salt);

            //Generate Password Reset Token
            const passwordResetToken = uuidv4();
            const expiresIn = moment().add(10, 'm').toISOString();

            //Update user with password token
            const user = await User.findOneAndUpdate({ email: req.body.email }, {
                $set: {
                    'security.passwordReset': {
                        token: passwordResetToken,
                        provisionalPassword: hashedPassword,
                        expiry: expiresIn
                    },
                },
            });

            await sendPasswordResetConfirmation({ email: req.body.email, passwordResetToken: passwordResetToken })
            res.status(200).json({ success: { status: 200, message: "PWD_RESET_EMAIL_SENT" } })

        } else {
            res.status(400).json({ error: { status: 400, message: "INPUT_ERROR" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}

/*  This method is for the confimration of the password reset, it requires the email and a password reset token
    for the request to succeed.  */
const resetPasswordConfirm = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        //check if passwordResetToken matches the token in the DB
        if (user.security.passwordReset.token === req.body.passwordResetToken) {

            //check if password reset token expired
            if (new Date().getTime() <= new Date(user.security.passwordReset.expiry).getTime()) {
                await User.updateOne({ email: req.body.email }, {
                    $set: {
                        'password': user.security.passwordReset.provisionalPassword,
                        'security.passwordReset.token': null,
                        'security.passwordReset.provisionalPassword': null,
                        'security.passwordReset.expiry': null,
                    },
                });

                res.status(200).json({ success: { status: 200, message: "PWD_RESET" } });
            } else {
                //Removing password reset token because expiry  
                await User.updateOne({ email: req.body.email }, {
                    $set: {
                        'security.passwordReset.token': null,
                        'security.passwordReset.provisionalPassword': null,
                        'security.passwordReset.expiry': null,
                    },
                });
                res.status(401).json({ error: { status: 401, message: "PWD_TOKEN_EXPIRED" } });
            }
        } else {
            res.status(401).json({ error: { status: 401, message: "INVALID_PWD_TOKEN" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}


const changeEmailConfirm = async (req, res) => {
    try {
        //Decode Access Token
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);

        //get user
        const user = await User.findOne({ email: decodeAccessToken.email });

        //check if email exists
        const existingEmail = await User.findOne({ email: user.security.changeEmail.provisionalEmail });

        if (!existingEmail) {//if the email doesn't already exist
            if (user.security.changeEmail.token === req.body.changeEmailToken) { //check that changeEmailToken is correct

                //check that email token isn't expired
                if (new Date().getTime() <= new Date(user.security.changeEmail.expiry).getTime()) {
                    await User.updateOne({ email: decodeAccessToken.email }, {
                        $set: {
                            'email': user.security.changeEmail.provisionalEmail,
                            'security.changeEmail.token': null,
                            'security.changeEmail.provisionalEmail': null,
                            'security.changeEmail.expiry': null,
                        },
                    });
                    res.status(200).json({ success: { status: 200, message: "EMAIL_CHANGED" } });
                } else {
                    res.status(401).json({ error: { status: 401, message: "EMAIL_TOKEN_EXPIRED" } });
                }
            } else {
                res.status(401).json({ error: { status: 401, message: "INVALID_EMAIL_TOKEN" } });
            }
        } else { //if the email already exists remove the emailreset fields
            await User.updateOne({ email: decodeAccessToken.email }, {
                $set: {
                    'security.changeEmail.token': null,
                    'security.changeEmail.expiry': null,
                    'security.changeEmail.provisionalEmail': null,
                }
            });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
};


const changeEmail = async (req, res) => {
    try {
        const { error } = emailSchema.validate({ email: req.body.provisionalEmail });

        if ( !error ) {
            //Decode Access Token
            const accessToken = req.header('Authorization').split(' ')[1];
            const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);


            //check if new Email Exists
            const emailExists = await User.findOne({ email: req.body.provisionalEmail });

            if (!emailExists) {
                //Generate an email confirmation token
                const changeEmailToken = uuidv4();
                const expiresIn = moment().add(10, 'm').toISOString();

                //update user with email token
                const user = await User.findOneAndUpdate({ email: decodeAccessToken.email }, {
                    $set: {
                        'security.changeEmail': {
                            token: changeEmailToken,
                            provisionalEmail: req.body.provisionalEmail,
                            expiry: expiresIn,
                        },
                    },
                });

                await changeEmailConfirmation({ email: user.email, emailToken: changeEmailToken });
                res.status(200).json({ success: { status: 200, message: "CHANGE_EMAIL_SENT" } });
            } else {
                res.status(400).json({ error: { status: 400, message: "EMAIL_EXISTS" } });
            }
        } else {
            res.status(400).json({ error: { status: 400, message: "INPUT_ERROR" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 4002, message: "BAD_REQUEST" } });
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
        } 
    });
}

const sendPasswordResetConfirmation = async (user) => {
    let transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reset your password',
        text: `Click link to reset your password: http://localhost:9000/reset-password/${user.passwordResetToken}`
    };

    await transport.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
};

const changeEmailConfirmation = async (user) => {
    let transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reset your password',
        text: `Click link to confirm your new email change: http://${process.env.FRONT_END_IP}/confirm-email-change/:${user.emailToken}`
    };

    await transport.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
};

//Token Helper Methods

/*  This method takes an id and email, and generates an JWT access token using the access token key and expiry env vars
    it also has a uName parameter that isn't used just in case we want to use username authenication instead */
const generateAccessToken = (id, email, uName) => {
    let items = {_id: id, email: email, };
    return JWT.sign(items, process.env.SECRET_ACCESS_TOKEN, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}

/*  This method takes an id and email, and generates an JWT refresh token using the refresh token key and expiry env vars
    it also has a uName parameter that isn't used just in case we want to use username authenication instead */
const generateRefreshToken = (id, email, uName) => {
    let items = {_id: id, email: email, };
    return JWT.sign(items, process.env.SECRET_REFRESH_TOKEN, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
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
    resetPassword, resetPasswordConfirm,
    changeEmail, changeEmailConfirm
};