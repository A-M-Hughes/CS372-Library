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

//Get featured books.
//Get the top 10 daily trending books from OpenLibrary.
const featured = async (req, res) => {
    try {
        let limit = 10;

        //API call for getting the trending books of the day
        let workUrl = `https://openlibrary.org/trending/daily.json?limit=${limit}`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(workUrl);

        //parse data into a useable form (array of Open Library IDs, titles, book cover links)
        let featuredBooks = [];
        for (let i = 0; i < resultJson.works.length; i++) {
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

//Get information about the work at the specified Open Library ID (OLID).
//The ID MUST end with a 'W'.
const workInformation = async (req, res) => {
    try {
        let bookId = req.params.id;

        //API call for getting the work's information
        let workUrl = `https://openlibrary.org/works/${bookId}.json`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(workUrl);

        //parse data into a useable form (title, authors, first published date,
        //description, book cover link, subjects, and first sentence)
        let authorIds = [];
        if (resultJson.authors) {
            for (let i = 0; i < resultJson.authors.length; i++) {
                authorIds.push(resultJson.authors[i].author.key);
            }
        }
        // get author information while only having 5 active requests at a time.
        let maxNumReqs = 5;
        let authors = "No author provided.";
        if (authorIds.length > 0) {
            authors = await getAuthorsFromIds(authorIds, maxNumReqs);
        }

        let bookCover = "No book cover provided.";
        if (resultJson.covers) {
            bookCover = `https://covers.openlibrary.org/b/id/${resultJson.covers[0]}-S.jpg`;
        }

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
            title: resultJson.title || "No title provided.",
            authors: authors,
            firstPublishDate: resultJson.first_publish_date || "No publish data provided.",
            description: description,
            bookCover: bookCover,
            subjects: resultJson.subjects || "No subjects provided.",
            firstSentence: firstSentence
        };

        res.send(bookInformation);
    } catch (error) {
        console.log(`Error: ${error}`);
        res.status(400).json({ error: { status: 400, message: error } });
    }
}

//Get book information from a specified Open Library ID (OLID).
//The ID MUST end with an 'M'.
const bookInformation = async (req, res) => {
    try {
        let bookId = req.params.id;

        //API call for getting the work's information
        let workUrl = `https://openlibrary.org/books/${bookId}.json`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(workUrl);

        //parse data into a useable form (title, description, authors, subjects, publishers,
        //publish date, publish places, series, book cover link, physical format, edition name,
        // ISBN-13, ISBN-10, associated works, and number of pages)
        let description = "No description provided.";
        if (resultJson.description) {
            if (typeof resultJson.description === "object") {
                description = resultJson.description.value;
            } else {
                description = resultJson.description;
            }
        }

        let authorIds = [];
        if (resultJson.authors) {
            for (let i = 0; i < resultJson.authors.length; i++) {
                authorIds.push(resultJson.authors[i].key);
            }
        }

        // get author information while only having 5 active requests at a time.
        let maxNumReqs = 5;
        let authors = "No author provided.";
        if (authorIds.length > 0) {
            authors = await getAuthorsFromIds(authorIds, maxNumReqs);
        }

        let bookCover = "No book cover provided.";
        if (resultJson.covers) {
            bookCover = `https://covers.openlibrary.org/b/id/${resultJson.covers[0]}-S.jpg`;
        }
        let works = "No associated works provided.";
        if (resultJson.works) {
            works = resultJson.works.map((work) => work.key.match(/OL\d+W$/)[0]);
        }
        let bookInformation = {
            title: resultJson.title || "No title provided.",
            description: description,
            authors: authors,
            subjects: resultJson.subjects || "No subjects provided.",
            publishers: resultJson.publishers || "No publisher provided.",
            publishDate: resultJson.publish_date || "No publish date provided.",
            publishPlaces: resultJson.publish_places || "No publish places provided.",
            series: resultJson.series || "No series provided.",
            bookCover: bookCover,
            physicalFormat: resultJson.physical_format || "No format provided.",
            editionName: resultJson.edition_name || "No edition name provided.",
            isbn13: resultJson.isbn_13 || "No ISBN-13 number provided.",
            isbn10: resultJson.isbn_10 || "No ISBN-10 number provided.",
            works: works,
            numPages: resultJson.number_of_pages || "No number of pages provided.",
        };

        res.send(bookInformation);
    } catch (error) {
        console.log(`Error: ${error}`);
        res.status(400).json({ error: { status: 400, message: error } });
    }
}

//Search OpenLibrary for a work. The query can be a book title, ISBN-10, ISBN-13, or OLID
//It fetches 10 works per request. the page query parameter specifies the page of the
//search result. For example, page 1 has books 0 through 9, page 2 has books 10 through 19,
//etc. If there is no page number provided, it defaults to page 1.
const searchBooks = async (req, res) => {
    try {
        let searchQuery = req.params.query;
        let page = req.params.page || 1;
        let limit = 10;

        //API call for getting 10 works from the search
        let workUrl = `https://openlibrary.org/search.json?q=${searchQuery}&limit=${limit}&page=${page}`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(workUrl);

        //parse data into a useable form (array of titles, subtitles, authors, subjects, first sentences,
        //book cover links, first published years, median page numbers, edition numbers, edition IDs,
        //average ratings, total ratings numbers, and ratings breakdowns)
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

            //ratingsBreakdown contains how many 1-star, 2-star, 3-star, 4-star, and 5-star ratings
            //their are for the work. 1-star ratings are stored at index 0, 2-star ratings are stored
            //at index 1, etc.
            let numRatingsTotal = "No ratings count provided.";
            let ratingsBreakdown = "No ratings breakdown provided.";
            if (currentDoc.ratings_count) {
                numRatingsTotal = currentDoc.ratings_count;
                ratingsBreakdown = [
                    currentDoc.ratings_count_1,
                    currentDoc.ratings_count_2,
                    currentDoc.ratings_count_3,
                    currentDoc.ratings_count_4,
                    currentDoc.ratings_count_5
                ];
            }

            let bookInformation = {
                title: currentDoc.title || "No title provided.",
                subtitle: currentDoc.subtitle || "No subtitle provided.",
                authors: currentDoc.author_name || "No author provided.",
                subjects: currentDoc.subject || "No subjects provided.",
                firstSentence: bookfirstSentence,
                bookCover: bookCover,
                firstPublishYear: currentDoc.first_publish_year || "No first published year provided.",
                medianNumPages: currentDoc.number_of_pages_median || "No median number of pages provided.",
                numEditions: currentDoc.edition_count || "No edition count provided.",
                editionIds: currentDoc.edition_key || "No edition keys provided.",
                ratingsAverage: currentDoc.ratings_average || "No average rating provided.",
                numRatingsTotal: numRatingsTotal,
                ratingsBreakdown: ratingsBreakdown
            };
            booksResult.push(bookInformation);
        }
        
        if (booksResult.length === 0) {
            booksResult.push("No results.");
        }

        //include search result data with useful statistics, including the number of total
        //search results found, the index of the first result on the current page, and the
        //number of search results on the current page.
        let numOnPage = Math.min(limit, resultJson.numFound - resultJson.start);
        if (numOnPage < 0) {
            numOnPage = 0;
        }
        let resultInfo = {
            numFound: resultJson.numFound,
            indexOfFirstResult: resultJson.start,
            numOnPage: numOnPage,
            results: booksResult
        }

        res.send(resultInfo);
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