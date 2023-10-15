const express = require('express');
const path = require('path');
const signup = require('./routes/signup.js').signup;
const login = require('./routes/login.js').login;
const dashboard = require('./routes/dashboard.js').dashboard;

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050; // If 5050 becomes the port than there is an issue with the .env file

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    }
);

// MIDDLEWARE:
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// ROUTES:

// GET Requests:
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/home/placeholder-home.html'));
});

/* This provides all of files from the public directory from the server, i.e. http://localhost:port/<FILE.NAME> and these files should be files like css styles, 
js functions, and images. Anything that should be publically accessed by the frontend html */
app.use(express.static('public'));

//This provides node_modules files under the /static directory, for files such as bootstrap if we decide to sent them from our server instead of accessing them from the web
app.use('/static', express.static(path.join(__dirname, 'node_modules'))); 

/* Activate the routes from the files under the directory "routes".
For example, all routes defined in dashboard.js are accessed by -> <baseurl> + /dashboard/ + <dashboard.js route> 
Therefore, the routes in dashboard.js can be accessed by url http://localhost:port/dashboard */
app.use('/signup', signup);
app.use('/login', login);
app.use('/dashboard', dashboard);

//This is the 404 Route. THIS MUST REMAIN LAST IT CATCHES ALL OTHER GET REQUESTS 
app.get('*', function(req, res){
    res.status(404).sendFile(path.join(__dirname, 'views/404.html')); //send 404 error and file
});