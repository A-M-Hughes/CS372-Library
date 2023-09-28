const express = require('express');
const router = express.Router();
const path = require('path');

//This send the test2-page 
router.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, '../views/test2-views/test2-page.html'));
});

router.get('/helloworld', (req, res) => {
    res.status(200).send("HELLO WORLD");
});


module.exports.test2Routes = router;