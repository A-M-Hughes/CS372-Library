const mongoose = require('mongoose');

const badRecs = new mongoose.Schema({
    accountEmail: {
        type: String,
        required: true,
    },
    recommendedOnce: [{
        type: String,
        required: true
    }],
    recommendedTwice: [{
        type: String,
        required: true
    }],
    blackList: [{
        type: String,
        required: true
    }]
});

module.exports = mongoose.model('badRecommendations', badRecs);