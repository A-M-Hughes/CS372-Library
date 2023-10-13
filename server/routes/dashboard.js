const express = require('express');
const router = express.Router();
const path = require('path');

// GET Requests
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard/placeholder-dashboard.html'));
});

module.exports.dashboard = router;