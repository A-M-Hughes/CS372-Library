const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');


require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

mongoose.connect(`${process.env.DB_PROTOCOL}://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?${process.env.DB_PARAMS}`,
    {
        autoIndex: true,
    }).then(() => {
        app.listen(PORT, (error) => {
            if (!error)
                console.log("Server is Successfully Running, and App is listening on port " + PORT);
            else
                console.log("Error occurred, server can't start", error);
        });
    });

// MIDDLEWARE:
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

// ROUTES:

/* This provides all of files from the public directory from the server, i.e. http://localhost:port/<FILE.NAME> and these files should be files like css styles, 
js functions, and images. Anything that should be publically accessed by the frontend html */
app.use(express.static('public'));

//This provides node_modules files under the /static directory, for files such as bootstrap if we decide to sent them from our server instead of accessing them from the web
app.use('/static', express.static(path.join(__dirname, 'node_modules')));

/*Access and host the routes needed for authentication*/
app.use('/api', authRoutes);

//This is the 404 Route. THIS MUST REMAIN LAST IT CATCHES ALL OTHER GET REQUESTS 
app.get('*', function (req, res) {
    res.status(404).json({error: {status: 404, message: "File Not Found"}}); //send 404 error and file
});