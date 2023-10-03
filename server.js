const express = require('express');
const path = require('path');
const test2Routes = require('./router/test2.js').test2Routes; //Gets the additional routes from the test2.js file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050; //If 5050 becomes the port than there is an issue with the .env file

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
// Home page 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/home/placeholder-home.html'));
});
// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/auth/placeholder-login.html'));
});
// Sign Up Page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/auth/placeholder-sign-up.html'));
});
// Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/dashboard/placeholder-dashboard.html'));
});

// POST Requests:
// Login Page
app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (true) {
        // TODO: Once the database is configured, replace 'true' with a condition to check database for user
        res.redirect('/dashboard');
    } else {

    }
    // res.send(`Email: ${email}, Password: ${password}`);
});
// Sign Up Page
app.post('/signup', (req, res) => {
    let name = req.body.firstname + " " + req.body.lastname;
    let email = req.body.email;
    let password = req.body.password;
    let confirm = req.body.confirm;
    if (true) {
        // TODO: Once the database is configured, replace 'true' with a condition to check database and make
        // sure the user does not already exist
        res.redirect('/dashboard');
    } else {
        
    }
    //res.send(`Name: ${name}, Email: ${email}, Password: ${password}, Confirm: ${confirm}`);
});

/*This provides all of files from the public directory from the server, i.e. http://localhost:port/<FILE.NAME> and these files should be files like css styles, 
js functions, and images. Anything that should be publically accessed by the frontend html */
app.use(express.static('public'));

//This provides node_modules files under the /static directory, for files such as bootstrap if we decide to sent them from our server instead of accessing them from the web
app.use('/static', express.static(path.join(__dirname, 'node_modules'))); 

/*activates the routes from the test2.js file under directory /test2. So all routes defined in test2.js are accessed by -> <baseurl> + /test2/ + <test2.js route> 
For example the two routes in test2.js can be accessed by url http://127.0.0.22:3000/test2 and http://127.0.0.22:3000/test2/helloworld*/
app.use('/test2', test2Routes); 

//This is the 404 Route. THIS MUST REMAIN LAST IT CATCHES ALL OTHER GET REQUESTS 
app.get('*', function(req, res){
    res.status(404).sendFile(path.join(__dirname, 'views/404.html')); //send 404 error and file
});