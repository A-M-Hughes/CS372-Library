const https = require('https');
const Semaphore = require('async-mutex').Semaphore;
const { openLibrarySearch, getJsonFromReq } = require('../helpers/openLibrarySearch');
const bookList = require('../models/bookList');
const User = require('../models/user');
const JWT = require('jsonwebtoken');

//Helper Functions

/**
 * Gets the author names (and IDs) from a list of author IDs. The function uses a sliding
 * window and schedules a new GET request as soon as a request is done while
 * keeping the number of active requests below or equal to maxNumReqs at a given time.
 * 
 * @param {Array.<string>} authorIds arrray of author Ids in the format /authors/OL123A
 * @param {number} maxNumReqs max number of HTTP requests that will be served at a time.
 */
async function getAuthorsFromIds(authorIds, maxNumReqs) {
    //Allow up to maxNumReqs requests
    const semaphore = new Semaphore(maxNumReqs);

    const authorNames = new Array(authorIds.length);

    authorIds.forEach(async (element, index) => {
        //Acquire semaphore
        const [value, release] = await semaphore.acquire();

        try {
            //Send http request and get author object
            let url = `https://openlibrary.org${element}.json`;
            let result = await getJsonFromReq(url);

            //Add author ID and name to object
            authorNames[index] = {
                id: element,
                name: (result.personal_name) ? result.personal_name : result.name
            };
        } catch (error) {
            console.log(`Error: ${error}`);
        } finally {
            //Release semaphore so that a new request can be made
            release();
        }
    });

    //Wait for all requests to finish before returning
    await semaphore.waitForUnlock(maxNumReqs);
    return authorNames;
}

/**
 * Parses the given book edition object into more specific, useful information for the front-end.
 * The information includes the title, description, authors, subjects, publishers,
 * publish date, publish places, series, book cover link, physical format, edition name,
 * ISBN-13, ISBN-10, associated works, and number of pages of the edition.
 * 
 * @param {object} json object containing edition information directly from Open Library's API
 * @param {Array.<Object>} authorsToIgnore array containing author ids and names to avoid
 * making extra requests to Open Library
 */
async function parseEditionInfo(json, authorsToIgnore) {
    let key = "No key provided.";
    if (json.key) {
        key = json.key.match(/OL\d+M$/)[0];
    }

    let description = "No description provided.";
    if (json.description) {
        if (typeof json.description === "object") {
            description = json.description.value;
        } else {
            description = json.description;
        }
    }

    let authorIdsToIgnore = authorsToIgnore.map((author) => author.id);
    let matchedAuthorIndex = -1;
    let authors = [];
    let authorIds = [];
    if (json.authors) {
        for (let i = 0; i < json.authors.length; i++) {
            //Already have the data of the authors from the array - use this instead
            //of making another request to Open Library
            matchedAuthorIndex = authorIdsToIgnore.indexOf(json.authors[i].key);
            if (matchedAuthorIndex >= 0) {
                authors.push(authorsToIgnore[matchedAuthorIndex]);
            } else {
                authorIds.push(json.authors[i].key);
            }
        }
    }

    //Get author information while only having a max of 5 active requests at a time.
    let maxNumReqs = 5;
    if (authorIds.length > 0) {
        authorResponse = await getAuthorsFromIds(authorIds, maxNumReqs);
        authors.push(...authorResponse);
    }
    if (authors.length === 0) {
        authors = "No author provided.";
    }

    let bookCover = "No book cover provided.";
    if (json.covers) {
        bookCover = `https://covers.openlibrary.org/b/id/${json.covers[0]}-S.jpg`;
    }
    let works = "No associated works provided.";
    if (json.works) {
        works = json.works.map((work) => work.key.match(/OL\d+W$/)[0]);
    }
    let edition = {
        key: key,
        title: json.title || "No title provided.",
        description: description,
        authors: authors,
        subjects: json.subjects || "No subjects provided.",
        publishers: json.publishers || "No publisher provided.",
        publishDate: json.publish_date || "No publish date provided.",
        publishPlaces: json.publish_places || "No publish places provided.",
        series: json.series || "No series provided.",
        bookCover: bookCover,
        physicalFormat: json.physical_format || "No format provided.",
        editionName: json.edition_name || "No edition name provided.",
        isbn13: json.isbn_13 || "No ISBN-13 number provided.",
        isbn10: json.isbn_10 || "No ISBN-10 number provided.",
        works: works,
        numPages: json.number_of_pages || "No number of pages provided.",
    };
    return edition;
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

        //Parse data into a useable form (array of Open Library IDs, titles, book cover links)
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
                bookCover: bookCover,
                authors: resultJson.works[i].author_name,
                firstPublishYear: resultJson.works[i].first_publish_year,


            });
        }

        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);
        const user = await User.findOne({ email: decodeAccessToken.email });
        const collection = await bookList.findOne({ _id: user.bookLists.ownedBooks });
        if (collection) {
            let count = 0;
            featuredBooks.forEach(x => {
                collection.books.forEach(y => {
                    if (y.title == x.title) {
                        x.inCollection = true;
                    }
                    x.number = count++;
                })
            })
        }

        let urls = []
        featuredBooks.forEach(x => {
            const url = `https://openlibrary.org/search.json?q=${x.title}&limit=1&page=1`;
            urls.push(url);
        })

        const openLibraryPromise = [ //Set up the openLibrary api urls
            openLibrarySearch(urls[0], 1, 1),
            openLibrarySearch(urls[1], 1, 1),
            openLibrarySearch(urls[2], 1, 1),
            openLibrarySearch(urls[3], 1, 1),
            openLibrarySearch(urls[4], 1, 1),
            openLibrarySearch(urls[5], 1, 1),
            openLibrarySearch(urls[6], 1, 1),
            openLibrarySearch(urls[7], 1, 1),
            openLibrarySearch(urls[8], 1, 1),
            openLibrarySearch(urls[9], 1, 1),
        ];

        await Promise.all(openLibraryPromise).then(x => { //make openLibrary API calls
            featuredBooks[0].rating = x[0].results[0].ratingsAverage;
            featuredBooks[1].rating = x[1].results[0].ratingsAverage;
            featuredBooks[2].rating = x[2].results[0].ratingsAverage;
            featuredBooks[3].rating = x[3].results[0].ratingsAverage;
            featuredBooks[4].rating = x[4].results[0].ratingsAverage;
            featuredBooks[5].rating = x[5].results[0].ratingsAverage;
            featuredBooks[6].rating = x[6].results[0].ratingsAverage;
            featuredBooks[7].rating = x[7].results[0].ratingsAverage;
            featuredBooks[8].rating = x[8].results[0].ratingsAverage;
            featuredBooks[9].rating = x[9].results[0].ratingsAverage;
        });

        res.send(featuredBooks);
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).json({
            error: {
                status: 400,
                message: `${error.name}: ${error.message}`
            }
        });
    }
}

//Get information about the work at the specified Open Library ID (OLID).
//The ID MUST end with a 'W'.
const workInfo = async (req, res) => {
    try {
        let workId = req.params.id;
        if (workId.search(/^OL\d+W$/) === -1) {
            return res.status(400).json({ error: { status: 400, message: 'invalid ID' } });
        }

        //API call for getting the work's information
        let workUrl = `https://openlibrary.org/works/${workId}.json`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(workUrl);

        //Parse data into a useable form (title, authors, first published date,
        //description, book cover link, subjects, and first sentence)
        let authorIds = resultJson.authors.map((element) => element.author.key);
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

        let work = {
            title: resultJson.title || "No title provided.",
            authors: authors,
            firstPublishDate: resultJson.first_publish_date || "No publish data provided.",
            description: description,
            bookCover: bookCover,
            subjects: resultJson.subjects || "No subjects provided.",
            firstSentence: firstSentence
        };

        res.send(work);
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).json({
            error: {
                status: 400,
                message: `${error.name}: ${error.message}`
            }
        });
    }
}

//Get information about 10 editions of a specified work. The page query parameter specifies
//the page of the editions results. For example, page 1 has editions 0 through 9, page 2 has
//editions 10 through 19, etc. If there is no page number provided, it defaults to page 1.
const workEditionInfo = async (req, res) => {
    try {
        let workId = req.params.id;
        if (workId.search(/^OL\d+W$/) === -1) {
            return res.status(400).json({ error: { status: 400, message: 'invalid ID' } });
        }

        if (req.params.page < 1) {
            return res.status(400).json({ error: { status: 400, message: 'page must be 1 or greater' } });
        }
        let page = req.params.page || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        //API call for getting 10 editions from a work
        let workEditionsUrl = `https://openlibrary.org/works/${workId}/editions.json?limit=${limit}&offset=${offset}`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(workEditionsUrl);

        if (resultJson.error === 'notfound' || resultJson.size === 0) {
            return res.status(404).json({ error: { status: 400, message: 'no editions found' } });
        }

        if (page > Math.ceil(resultJson.size / 10)) {
            return res.status(400).json({ error: { status: 400, message: 'page is out of bounds' } });
        }

        //Make request for the work's author data (author IDs)
        let workUrl = `https://openlibrary.org/works/${workId}.json`;
        let workInfo = await getJsonFromReq(workUrl);
        let workAuthorIds = (typeof workInfo.authors === 'object')
            ? workInfo.authors.map((element) => element.author.key)
            : [];

        //Get the work's author IDs and associated names
        let maxNumReqs = 5;
        let workAuthors = [];
        if (workAuthorIds.length > 0) {
            workAuthors = await getAuthorsFromIds(workAuthorIds, maxNumReqs);
        }

        //Parse JSON object into more specific, useful information
        let editions = [];
        for (let i = 0; i < resultJson.entries.length; i++) {
            let edition = await parseEditionInfo(resultJson.entries[i], workAuthors);
            editions.push(edition);
        }

        if (editions.length === 0) {
            editions.push("No results.");
        }

        //include edition results with useful statistics, including the number of total
        //editions found, the index of the first edition on the current page, and the
        //number of editions on the current page.
        let editionInfo = {
            numFound: resultJson.size,
            indexOfFirstResult: offset,
            numOnPage: Math.min(limit, resultJson.size - offset),
            editions: editions
        }

        res.send(editionInfo);
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).json({
            error: {
                status: 400,
                message: `${error.name}: ${error.message}`
            }
        });
    }
}

//Get book information from a specified Open Library ID (OLID).
//The ID MUST end with an 'M'.
const bookInfo = async (req, res) => {
    try {
        let bookId = req.params.id;
        if (bookId.search(/^OL\d+M$/) === -1) {
            return res.status(400).json({ error: { status: 400, message: 'invalid ID' } });
        }

        //API call for getting the book's information
        let bookUrl = `https://openlibrary.org/books/${bookId}.json`;

        //Make request and get JSON object containing information
        let resultJson = await getJsonFromReq(bookUrl);

        //Parse JSON object into more specific, useful information
        //Empty array, as we do not know author information about the associated work
        let book = await parseEditionInfo(resultJson, []);

        res.send(book);
    } catch (error) {
        console.log(`Error: ${error.stack}`);
        return res.status(400).json({
            error: {
                status: 400,
                message: `${error.name}: ${error.message}`
            }
        });
    }
}

//Search OpenLibrary for a work. The query can be a book title, ISBN-10, ISBN-13, or OLID
//It fetches 10 works per request. The page query parameter specifies the page of the
//search result. For example, page 1 has books 0 through 9, page 2 has books 10 through 19,
//etc. If there is no page number provided, it defaults to page 1.
const searchBooks = async (req, res) => {
    try {
        let searchQuery = req.params.query;
        if (req.params.page < 1) {
            return res.status(400).json({ error: { status: 400, message: 'page must be 1 or greater' } });
        }
        let page = req.params.page || 1;
        let limit = 10;

        //API call for getting 10 works from the search
        let searchUrl = `https://openlibrary.org/search.json?q=${searchQuery}&limit=${limit}&page=${page}`;

        const result = await openLibrarySearch(searchUrl, limit, page);

        if (result === 'no search results found') {
            res.status(404).json({ error: { status: 404, message: 'no search results found' } });
            return;
        } else if (result === 'page is out of bounds') {
            res.status(400).json({ error: { status: 400, message: 'page is out of bounds' } });
        }

        const accessToken = req.header('Authorization').split(' ')[1];
        const decodeAccessToken = JWT.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);
        const user = await User.findOne({ email: decodeAccessToken.email });
        const collection = await bookList.findOne({ _id: user.bookLists.ownedBooks });
        if (collection) {
            let count = 0;
            result.results.forEach(x => {
                collection.books.forEach(y => {
                    if (y.title == x.title) {
                        x.inCollection = true;
                    }
                    x.number = count++;
                })
            })
        }


        res.send(result);
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).json({
            error: {
                status: 400,
                message: `${error.name}: ${error.message}`
            }
        });
    }
}

module.exports = {
    featured,
    workInfo,
    workEditionInfo,
    bookInfo,
    searchBooks
};