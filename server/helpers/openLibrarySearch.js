const https = require('https');

const openLibrarySearch = async (URL, limit, page) => {
    //Make request and get JSON object containing information
    let resultJson = await getJsonFromReq(URL);

    if (resultJson.numFound === 0) {
        return 'no search results found';
    }

    if (page > Math.ceil(resultJson.numFound / 10)) {
        return 'page is out of bounds';
    }

    //Parse data into a useable form (array of titles, subtitles, authors, subjects, first sentences,
    //book cover links, first published years, median page numbers, edition numbers, edition IDs,
    //average ratings, total ratings numbers, and ratings breakdowns)
    let searchResults = [];
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

        let result = {
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
        searchResults.push(result);
    }

    let numOnPage = Math.min(limit, resultJson.numFound - resultJson.start);

    let searchResultInfo = {
        numFound: resultJson.numFound,
        indexOfFirstResult: resultJson.start,
        numOnPage: numOnPage,
        results: searchResults
    }

    return searchResultInfo;
}


/**
 * Gets the JSON object at the specified URL.
 * 
 * @param {string} workUrl The URL to which a request must be made
 * @returns the parsed JSON object containin the data
 */
async function getJsonFromReq(workUrl) {
    //Get data from workUrl
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

    //Parse data
    let result = await promise;
    return JSON.parse(result);
}

module.exports = {
    getJsonFromReq,
    openLibrarySearch
}
