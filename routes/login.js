const express = require('express');
const router = express.Router();
const path = require('path');

// GET Requests
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/auth/placeholder-login.html'));
});

// POST Requests:
router.post('/', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (true) {
        // TODO: Once the database is configured, replace 'true' with a condition to check database for user
        res.redirect('../dashboard');
    } else {

    }
    res.send(`Email: ${email}, Password: ${password}`);
});

module.exports.login = router;