/* This file is a helper file that will validate the JWT tokens, this ensure the identity of our end users and 
verifies that the tokens are 1) valid, and 2) not expired. These tokens have a defined length in the .envExample file, 
and that length should be short, like 15 minutes short for security as those JWTs can be used to access the account. JWTs 
are provided from the server when the user logs in and when the server receives valid refresh token to the /auth/token endpoint
where another JWT will be generated. In order to keep the JWT sercure, we need to ensure the SECRET_ACCESS_TOKEN env variable 
remains secure as it is our secret key for generating the JWTs. Also we could possibly change in it intervals, of course this 
is a course project, but doing that is best practice*/

const JWT = require('jsonwebtoken');

//This middleware gets the JWT token, verifies it and moves to the next function, otherwise catches and throws an error
const auth = (req, res, next) => {
    try {
        const token = req.header('authorization').split(' ')[1]

        if (token) { //If token is present
            try {
                req.user = JWT.verify(token, process.env.SECRET_ACCESS_TOKEN); //Attempt to verify token
                next();
            } catch (error) { //Catch error with the token
                console.log(error);
                res.status(401).json({ error: { status: 401, message: "Bad Token" } });
            }

        } else { //If token is not provided or some other error with the request
            res.status(400).json({ error: { status: 401, message: "Access Denied, Unauthorized" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "Access Denied, Client Error" } });
    }
}

module.exports = auth;