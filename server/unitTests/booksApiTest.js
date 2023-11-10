const chai = require('chai');
const chaiHTTP = require('chai-http');
const server = require('../server.js');
const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHTTP);

let access_token, refresh_token, removeID, emailToken;

const randomEmail = Math.random().toString(36).substring(8) + "@gmail.com";
const randomPass = Math.random().toString(36).substring(0).repeat(2);
console.log(randomEmail + " | " + randomPass);

before(function (done) {
    this.timeout(4000);
    setTimeout(done, 3000);
});

describe('POST /api/register', () => {
    after(async () => {
        const user = await User.findOne({ email: randomEmail });
        emailToken = user.emailToken;
        console.log(emailToken);
    });

    it('should return a registeration success response', (done) => {
        chai.request(server)
            .post('/api/register')
            .send({ "email": randomEmail, "password": randomPass })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('REGISTER_SUCCESS');

                expect(res.body.success).to.have.property('accessToken');
                expect(res.body.success).to.have.property('refreshToken');
                expect(res.body.success).to.have.property('user');
                expect(res.body.success.user).to.have.property('id');

                access_token = res.body.success.accessToken;
                refresh_token = res.body.success.refreshToken;
                id = res.body.success.id;
                done();
            });
    });
});

describe('GET /api/booksApi/featured', function () {
    it('should get array of 10 works', function (done) {
        chai.request(server)
            .get('/api/booksApi/featured')
            .set({ "Authorization": `Bearer ${access_token}` })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array').that.has.lengthOf(10)
                for (let i = 0; i < res.body.length; i++) {
                    expect(res.body[i]).to.have.property('olid')
                        .to.match(/^OL\d+W$/);
                    expect(res.body[i]).to.have.property('title');
                    expect(res.body[i]).to.have.property('bookCover')
                        .to.match(/https:\/\/covers.openlibrary.org\/b\/id\/\d+-S.jpg/);
                }
                done();
            });
    })
})

describe('GET /api/works/OL27448W', function () {
    it('should get information about the specified work (The Lord of the Rings)', function (done) {
        chai.request(server)
            .get('/api/booksApi/works/OL27448W')
            .set({ "Authorization": `Bearer ${access_token}` })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('title');
                expect(res.body).to.have.property('authors');
                expect(res.body).to.have.property('firstPublishDate');
                expect(res.body).to.have.property('description');
                expect(res.body).to.have.property('bookCover')
                    .to.match(/https:\/\/covers.openlibrary.org\/b\/id\/\d+-S.jpg/);
                expect(res.body).to.have.property('subjects');
                expect(res.body).to.have.property('firstSentence');
                done();
            });
    })
})

describe('GET /api/works/OL5237526M', function () {
    it('should return an error due to invalid ID (ID of a book, not a work)', function (done) {
        chai.request(server)
            .get('/api/booksApi/works/OL5237526M')
            .set({ "Authorization": `Bearer ${access_token}` })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    })
})

describe('GET /api/books/OL26451897M', function () {
    it('should get information about the specified book (The Fellowship of the Ring)', function (done) {
        chai.request(server)
            .get('/api/booksApi/books/OL26451897M')
            .set({ "Authorization": `Bearer ${access_token}` })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('title');
                expect(res.body).to.have.property('description');
                expect(res.body).to.have.property('authors');
                expect(res.body).to.have.property('subjects');
                expect(res.body).to.have.property('publishers');
                expect(res.body).to.have.property('publishDate');
                expect(res.body).to.have.property('series');
                expect(res.body).to.have.property('bookCover')
                    .to.match(/https:\/\/covers.openlibrary.org\/b\/id\/\d+-S.jpg/);
                expect(res.body).to.have.property('physicalFormat');
                expect(res.body).to.have.property('publishPlaces');
                expect(res.body).to.have.property('editionName');
                expect(res.body).to.have.property('isbn13');
                expect(res.body).to.have.property('isbn10');
                expect(res.body).to.have.property('works');
                for (let i = 0; i < res.body.works.length; i++) {
                    expect(res.body.works[i]).to.match(/^OL\d+W$/);
                }
                expect(res.body).to.have.property('numPages');
                done();
            });
    })
})

describe('GET /api/books/OL27448W', function () {
    it('should return an error due to invalid ID (ID of a work, not a book)', function (done) {
        chai.request(server)
            .get('/api/booksApi/books/OL27448W')
            .set({ "Authorization": `Bearer ${access_token}` })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    })
})

describe('GET /api/searchBooks/lord+of+the+rings', function () {
    it('should return information about top 10 search results (works)', function (done) {
        chai.request(server)
            .get('/api/booksApi/searchBooks/lord+of+the+rings')
            .set({ "Authorization": `Bearer ${access_token}` })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array').that.has.lengthOf(10);
                for (let i = 0; i < res.body.length; i++) {
                    expect(res.body[i]).to.have.property('title');
                    expect(res.body[i]).to.have.property('subtitle');
                    expect(res.body[i]).to.have.property('authors');
                    expect(res.body[i]).to.have.property('subjects');
                    expect(res.body[i]).to.have.property('firstSentence');
                    expect(res.body[i]).to.have.property('bookCover');
                    expect(res.body[i]).to.have.property('firstPublishYear');
                    expect(res.body[i]).to.have.property('medianNumPages');
                    expect(res.body[i]).to.have.property('numEditions');
                    expect(res.body[i]).to.have.property('editionIds');
                    expect(res.body[i]).to.have.property('ratingsAverage');
                    expect(res.body[i]).to.have.property('numRatingsTotal');
                    expect(res.body[i]).to.have.property('ratingsBreakdown');
                }
                expect(res.body[0].ratingsBreakdown).to.be.an('array').that.has.lengthOf(5);
                done();
            });
    })
})

after(async () => {
    try {
        await User.deleteOne({ id: removeID });
        console.log("data deleted");
    } catch (err) {
        console.error(err);
    }
});