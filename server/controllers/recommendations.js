const bookList = require('../models/bookList');
const User = require('../models/user');
const badRecommendations = require('../models/badRecommendations');
const JWT = require('jsonwebtoken');
const { openLibrarySearch } = require('../helpers/openLibrarySearch');

require("dotenv").config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

/*  This route is for creating the recommendations, it utilizes OpenAI's Chatgpt 4 to generate recommendations. It requires an access token,
    and nothing in the request body. It should be used with a POST request.
*/
const createRecommendations = async (req, res) => {
    try {
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);

        //check if user exists
        const user = await User.findOne({ email: decodeAccessToken.email });

        if (user) {
            const userId = user._id;
            //These are the records from the user,
            let book_list;  //Current books in their collection
            let recommendationList; //Current recommendations for the user
            let badRecommendationList; //Bad recommendations for the users

            const promises = [ //Fetch the respective lists
                bookList.findOne({ _id: user.bookLists.ownedBooks }),
                bookList.findOne({ _id: user.bookLists.recommendations }),
                badRecommendations.findOne({ _id: user.bookLists.badRecommendations })
            ];

            await Promise.all(promises).then(results => {
                book_list = results[0];
                recommendationList = results[1];
                badRecommendationList = results[2];
            });

            let bookTitles = []; //This grabs the book titles from the user's collection
            if (book_list != null) {
                book_list.books.forEach(x => {
                    bookTitles.push(x.title);
                });
            }

            let recommendationTitles = []; //This grabs the book titles from the user's recommendations
            recommendationList.books.forEach(x => {
                recommendationTitles.push(x.title);
            });

            let genres = []; //This grabs the genres from the user's account
            user.genres.forEach(x => {
                genres.push(x);
            });

            let blackList = []; //This grabs the list of books the user does not want recommended 
            badRecommendationList.blackList.forEach(x => {
                blackList.push(x);
            })
            //get recommendations
            const recString = await generateRecommendation(bookTitles, recommendationTitles, ['action'], blackList);

            let recommendations = recString.split('|');
            let results = [];
            let urls = [];

            recommendations.forEach(x => {
                const url = `https://openlibrary.org/search.json?q=${x}&limit=5&page=1`;
                urls.push(url);
            });

            const openLibraryPromise = [ //Set up the openLibrary api urls
                openLibrarySearch(urls[0], 5, 1),
                openLibrarySearch(urls[1], 5, 1),
                openLibrarySearch(urls[2], 5, 1),
                openLibrarySearch(urls[3], 5, 1),
                openLibrarySearch(urls[4], 5, 1),
            ];

            await Promise.all(openLibraryPromise).then(value => { //make openLibrary API calls
                results[0] = value[0];
                results[1] = value[1];
                results[2] = value[2];
                results[3] = value[3];
                results[4] = value[4];
            });

            results.forEach(x => { //Parse the results and create new recommendations based on the results
                let newRecommendation = {
                    title: x.results[0].title,
                    author: x.results[0].authors,
                    pageNumber: x.results[0].medianNumPages,
                    coverLink: x.results[0].bookCover,
                    rating: x.results[0].ratingsAverage,
                    publishedYear: x.results[0].firstPublishYear
                };

                recommendationList.books.push(newRecommendation);
            });

            await recommendationList.save();

            res.status(200).json({ success: { status: 200, message: 'RECOMMENDATIONS_ADDED' } });
        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 500, message: "SERVER_ERROR" } });
    }
}


/*  This function handles the collection retrieval functionality for user's recommendations, it should be used with GET requests and takes
    nothing in the request body
*/
const getRecommendations = async (req, res) => {
    try {
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);
        //get user
        const user = await User.findOne({ email: decodeAccessToken.email });

        if (user) {
            //get recommendation list then return
            let books = await bookList.findById(user.bookLists.recommendations);

            res.status(200).json({ success: { status: 200, message: "RECOMMENDATIONS_FOUND", books: books.books } });

        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }
    } catch (error) {
        res.status(500).json({ error: { status: 400, message: "SERVER_ERROR" } });
    }
}

/*  This function deletes a recommendation from the user's recommendations. It also moves it into the bad recommendations record. 
    There are three array in that record, recommendedOnce, recommendedTwice, blacklist. If the user denies the recommendation once the 
    book goes to the recommenedOnce array, then if its recommended again and denied, it moves to the recommendedTwice array. If it gets recommended
    a third time and denied, its put into the black list where it won't be recommended again. 
*/
const deleteRecommendation = async (req, res) => {
    try {
        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);


        const user = await User.findOne({ email: decodeAccessToken.email });
        let recommendationID = req.body.recommendationID;
        //check if user exists
        if (user) {
            if (!recommendationID) { //Check if bookID is in the request body
                res.status(400).json({ error: { status: 400, message: 'INPUT_ERROR', errors: error.details, original: error._original } });
                return;
            }

            let recommendation = await bookList.findById(user.bookLists.recommendations);
            if (!recommendation) { res.status(410).json({ error: { status: 410, message: "RECOMMENDATION_LIST_NOT_FOUND", } }); return; }
            else {
                //If there is no error, get the number of books from the book list array and then remove an the selected book from the array
                let numRecs = recommendation._doc.books.length;
                let badRec = recommendation.books.find((element) => element.id === recommendationID);
                
                let badRecommendationList = await badRecommendations.findOne({_id: user.bookLists.badRecommendations});
                let index;

                if(index = badRecommendationList.recommendedOnce.indexOf(badRec.title) !== -1) { //check if the selected recommendation is in the recommendOnce array
                    badRecommendationList.recommendedTwice.push(badRec.title); //move selected book to the recommendedTwice array
                    badRecommendationList.recommendedOnce.remove(badRec.title);
                } else if(index = badRecommendationList.recommendedTwice.indexOf(badRec.title) !== -1) { //check if the selected recommendation is in the recommendTwice array
                    badRecommendationList.recommendedTwice.remove(badRec.title);
                    badRecommendationList.blackList.push(badRec.title);
                } else { //otherwise the recommendation gets put into the recommendOnce array
                    badRecommendationList.recommendedOnce.push(badRec.title);
                }

                let selectedRec = recommendation.books.pull(recommendationID);

                if (selectedRec.length == numRecs) { //Check that an element was removed, if not send error response
                    res.status(410).json({ error: { status: 410, message: "RECOMMENATION_NOT_FOUND", } });
                }
                else {

                    const promises = [
                        await badRecommendationList.save(),
                        await recommendation.save()
                    ];
        
                    await Promise.all(promises);
                    
                    res.status(200).json({ succes: { status: 200, message: "RECOMMENDATION_DELETED" } });
                }
            }

        } else {
            res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
        }
    } catch (error) {
        res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
    }
}
//This function queries the OpenAI API to make a chatgpt request 
async function generateRecommendation(book_list, recommendation_list, genres, blackList) {
    let content = "";

    content = 'A user likes the genres that are in this array: [' + genres + ']. The user already has the books this array: ' +
        '[' + book_list + ']. Give me up to 5 book recommendations for this user in a single string, delimited by the pipe character |. Do not include books the user owns or books from ' +
        'this array: [' + recommendation_list + ',' + blackList + ']. Please give specific, plaintext book titles, not titles of book series. Do not give me ' +
        'the authors of the book and do not number the titles. DO NOT INCLUDE QUOTATION MARKS.';

    console.log(content + '\n');

    const stream = await openai.beta.chat.completions.stream({
        model: 'gpt-4-1106-preview', //REPLACE WITH gpt-4 FOR PRESENTATION gpt-3.5 is cheaper so use gpt-4 for final testing!!!
        messages: [{ role: 'user', content: content }],
        stream: true,
    });

    let recommendations = ""
    for await (const chunk of stream) {
        recommendations += (chunk.choices[0]?.delta?.content || '');
    }

    const chatCompletion = await stream.finalChatCompletion();
    console.log(recommendations);
    return recommendations;
}



module.exports = {
    createRecommendations, getRecommendations, deleteRecommendation
};