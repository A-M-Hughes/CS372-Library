const express = require('express');
const router = express.Router();
const path = require('path');

// GET Requests
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/auth/placeholder-sign-up.html'));
});

// POST Requests
router.post('/', (req, res) => {
    let name = req.body.firstname + " " + req.body.lastname;
    let email = req.body.email;
    let password = req.body.password;
    let confirm = req.body.confirm;
    if (true) {
        // TODO: Once the database is configured, replace 'true' with a condition to check database and make
        // sure the user does not already exist
        res.redirect('../dashboard');
    } else {
        
    }
    // res.send(`Name: ${name}, Email: ${email}, Password: ${password}, Confirm: ${confirm}`);
});

module.exports.signup = router;