const https = require('https');
const Semaphore = require('async-mutex').Semaphore;

//Helper Functions

/**
 * Gets the JSON object at the specified URL.
 * 
 * @param {string} workUrl The URL to which a request must be made
 * @returns the parsed JSON object containin the data
 */
async function getJsonFromReq(workUrl) {
    //get data from workUrl
    let promise = new Promise((resolve, reject) => {
        let result = "";
        https.get(workUrl, (response) => {
            response.on("data", (chunk) => {
                result += chunk;
            });

            response.on("end", () => {
                resolve(result);
            });
        }).on("error", (error) => {
            console.log(`Error: ${error}`);
            reject(error);
        });
    });

    //parse data
    let result = await promise;
    return JSON.parse(result);
}

/**
 * Gets the author names from a list of author IDs. The function uses a sliding
 * window and schedules a new GET request as soon as a request is done while
 * keeping the number of active requests below or equal to maxNumReqs at a given time.
 * 
 * @param {*} authorIds arrray of author Ids in the format /authors/OL123A
 * @param {*} maxNumReqs max number of HTTP requests that will be served at a time.
 */
async function getAuthorsFromIds(authorIds, maxNumReqs) {
    //allow up to maxNumReqs requests
    const semaphore = new Semaphore(maxNumReqs);

    const authorNames = new Array(authorIds.length);

    authorIds.forEach(async (element, index) => {
        //aquire semaphore
        const [value, release] = await semaphore.acquire();

        try {
            //send http request and get author object
            let url = `https://openlibrary.org${element}.json`;
            let result = await getJsonFromReq(url);

            //add author name to object
            authorNames[index] = (result.personal_name) ? result.personal_name : result.name;
        } catch (error) {
            console.log(`Error: ${error}`);
        } finally {
            //release semaphore so that a new request can be made
            release();
        }
    });

    //wait for all requests to finish before returning
    await semaphore.waitForUnlock(maxNumReqs);
    return authorNames;
}

//Route Controllers

//get the top 10 daily trending books from OpenLibrary
const featured = async (req, res) => {
    try {
        let limit = 10;

        //API call for getting the trending books of the day
        let workUrl = `https://openlibrary.org/trending/daily.json?limit=${limit}`;
        let resultJson = await getJsonFromReq(workUrl);

        //parse data into a useable form (Open Library ID, title, book cover link)
        let featuredBooks = [];
        for (let i = 0; i < limit; i++) {
            let bookCover = "No cover provided.";
            if (resultJson.works[i].cover_i) {
                let bookCoverId = resultJson.works[i].cover_i;
                bookCover = `https://covers.openlibrary.org/b/id/${bookCoverId}-S.jpg`;
            }

            featuredBooks.push({
                olid: resultJson.works[i].key.split("/")[2],
                title: (resultJson.works[i].title) ? resultJson.works[i].title : "No title provided.",
                bookCover: bookCover
            });
        }

        res.send(featuredBooks);
    } catch (error) {
        console.log(`Error: ${error}`);
        res.status(400).json({ error: { status: 400, message: error } });
    }
}

//Get information about the work at the specified Open Library ID (OLID). The ID MUST end with a 'W'.
const workInformation = async (req, res) => {
    try {
        let bookId = req.params.id;

        //API call for getting the work's information
        let workUrl = `https://openlibrary.org/works/${bookId}.json`;

        //parse data into JSON object
        let resultJson = await getJsonFromReq(workUrl);

        //parse data into a useable form (title, authors, first published date,
        //description, book cover link, subjects, and first sentence)
        let authorIds = [];
        for (let i = 0; i < resultJson.authors.length; i++) {
            authorIds.push(resultJson.authors[i].author.key);
        }

        // get author information while only having 5 active requests at a time.
        let maxNumReqs = 5;
        let authors = await getAuthorsFromIds(authorIds, maxNumReqs);

        let bookCoverId = resultJson.covers[0];
        let bookCover = `https://covers.openlibrary.org/b/id/${bookCoverId}-S.jpg`;

        let description = "No description provided.";
        if (resultJson.description) {
            if (typeof resultJson.description === "object") {
                description = resultJson.description.value;
            } else {
                description = resultJson.description;
            }
        }

        let firstSentence = "No first sentence provided.";
        if (resultJson.first_sentence) {
            firstSentence = resultJson.first_sentence.value;
        } else if (resultJson.excerpts) {
            firstSentence = resultJson.excerpts[0].excerpt;
        }

        let bookInformation = {
            title: (resultJson.title) ? resultJson.title : "No title provided.",
            authors: (resultJson.authors) ? authors : "No author provided.",
            firstPublishDate: (resultJson.first_publish_date) ?
                    resultJson.first_publish_date : "No publish data provided.",
            description: description,
            bookCover: (resultJson.covers) ? bookCover : "No cover provided.",
            subjects: (resultJson.subjects) ? resultJson.subjects : "No subjects provided.",
            firstSentence: firstSentence
        };

        res.send(bookInformation);
    } catch (error) {
        console.log(`Error: ${error}`);
        res.status(400).json({ error: { status: 400, message: error } });
    }
}

//Get book information from a specified Open Library ID (OLID). The ID MUST end with an 'M'.
const bookInformation = async (req, res) => {
    try {
        let bookId = req.params.id;

        //API call for getting the work's information
        let workUrl = `https://openlibrary.org/books/${bookId}.json`;

        //parse data into JSON object
        let resultJson = await getJsonFromReq(workUrl);

        res.send(resultJson);

        //parse data into a useable form (title, authors, first published date,
        // //description, book cover link, subjects, and first sentence)
        // let authorIds = [];
        // for (let i = 0; i < resultJson.authors.length; i++) {
        //     authorIds.push(resultJson.authors[i].author.key);
        // }

        // // get author information while only having 5 active requests at a time.
        // let maxNumReqs = 5;
        // let authors = await getAuthorsFromIds(authorIds, maxNumReqs);

        // let bookCoverId = resultJson.covers[0];
        // let bookCover = `https://covers.openlibrary.org/b/id/${bookCoverId}-S.jpg`;

        // let description = "No description provided.";
        // if (resultJson.description) {
        //     if (typeof resultJson.description === "object") {
        //         description = resultJson.description.value;
        //     } else {
        //         description = resultJson.description;
        //     }
        // }

        // let firstSentence = "No first sentence provided.";
        // if (resultJson.first_sentence) {
        //     firstSentence = resultJson.first_sentence.value;
        // } else if (resultJson.excerpts) {
        //     firstSentence = resultJson.excerpts[0].excerpt;
        // }

        // let bookInformation = {
        //     title: (resultJson.title) ? resultJson.title : "No title provided.",
        //     authors: (resultJson.authors) ? authors : "No author provided.",
        //     firstPublishDate: (resultJson.first_publish_date) ?
        //             resultJson.first_publish_date : "No publish data provided.",
        //     description: description,
        //     bookCover: (resultJson.covers) ? bookCover : "No cover provided.",
        //     subjects: (resultJson.subjects) ? resultJson.subjects : "No subjects provided.",
        //     firstSentence: firstSentence
        // };

        // res.send(bookInformation);
    } catch (error) {
        console.log(`Error: ${error}`);
        res.status(400).json({ error: { status: 400, message: error } });
    }
}

//Search OpenLibrary for a book. The query can be a book title, ISBN-10, ISBN-13, or OLID
//It fetches 10 books per request. the page query parameter specifies the page of the
//search result. For example, page 1 has books 0 through 9, page 2 has books 10 through 19,
//etc.

/* 
TODO Flow:
Search for WORKS (not books) -> list of books with non-edition specific info (e.g., title, authors, subjects, median num pages, edition count)
Click on work -> get list of editions (books) with specific information (e.g., title, authors, publishers publish dates, publish locations, num pages, edition, )
*/

const searchBooks = async (req, res) => {
    try {
        let searchQuery = req.params.query;
        let page = req.params.page || 1;
        let limit = 10;

        //API call for getting 10 works from the search
        let workUrl = `https://openlibrary.org/search.json?q=${searchQuery}&limit=${limit}&page=${page}`;

        //parse data into JSON object
        let resultJson = await getJsonFromReq(workUrl);

        //parse the data into a more usable format
        let booksResult = [];
        for (let i = 0; i < resultJson.docs.length; i++) {
            let currentDoc = resultJson.docs[i];

            let bookfirstSentence = "No first sentence provided.";
            if (currentDoc.first_sentence) {
                bookfirstSentence = currentDoc.first_sentence[0];
            }
            let bookCover = "No book cover provided.";
            if (currentDoc.cover_i) {
                bookCover = `https://covers.openlibrary.org/b/id/${currentDoc.cover_i}-S.jpg`;
            }
            let bookSubjects = "No subjects provided.";
            if (currentDoc.subject) {
                bookSubjects = currentDoc.subject.slice(0, 10);
            }

            let bookInformation = {
                title: currentDoc.title || "No title provided.",
                subtitle: currentDoc.subtitle || "No subtitle provided.",
                authors: currentDoc.author_name || "No author provided.",
                subjects: bookSubjects,
                firstSentence: bookfirstSentence,
                bookCover: bookCover,
                firstPublishYear: currentDoc.first_publish_year || "No first published year provided.",
                medianNumPages: currentDoc.number_of_pages_median || "No median number of pages provided.",
                numEditions: currentDoc.edition_count || "No edition count provided.",
                ratingsInfo: {
                    ratingsAverage: currentDoc.ratings_average || "No average rating provided.",
                    numRatingsTotal: currentDoc.ratings_count || "No ratings count provided.",
                    numRatings1: currentDoc.ratings_count_1,
                    numRatings2: currentDoc.ratings_count_2,
                    numRatings3: currentDoc.ratings_count_3,
                    numRatings4: currentDoc.ratings_count_4,
                    numRatings5: currentDoc.ratings_count_5,
                }
            };
            booksResult.push(bookInformation);
        }
        
        res.send(booksResult);
    } catch (error) {
        console.log(`Error: ${error}`);
        res.status(400).json({ error: { status: 400, message: error } });
    }
}

module.exports = {
    featured,
    workInformation,
    bookInformation,
    searchBooks
};