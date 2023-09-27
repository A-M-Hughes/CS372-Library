const express = require('express');
const path = require('path');
const test2Routes = require('./router/test2.js').test2Routes; //Gets the additional routes from the test2.js file

const app = express();
const PORT = 3000; //Currently the port is hardcoded at 3000, can be changed if we decide to utilize a .env file
  

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    }
);

//Sends the home page 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/test-homepage.html'));
})

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
    res.status(404).sendFile(path.join(__dirname, 'views/404.html')) //send 404 error and file
});