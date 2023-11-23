const chai = require('chai');
const chaiHTTP = require('chai-http');
const server = require('../server.js');
const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHTTP);

let email_reset_token, PWD_reset_token, access_token, refresh_token, removeID, emailToken;

const randomPass = Math.random().toString(36).substring(0).repeat(2);
const randomName = Math.random().toString(36).substring(2);
const randomEmail = Math.random().toString(36).substring(8) + "@gmail.com";
const changeRandomEmail = Math.random().toString(36).substring(8) + "@gmail.com";


before(function (done) { //This waits for the connection to the DB to be set up before running the tests
    this.timeout(4000);
    setTimeout(done, 3000);
});


describe('POST /api/register', () => {
    after(async () => {
        const user = await User.findOne({ email: randomEmail });
        emailToken = user.emailToken;
    });

    it('should return a registeration success response', (done) => {
        chai.request(server)
            .post('/api/register')
            .send({ "email": randomEmail, "name": randomName, "password": randomPass })
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
                removeID = res.body.success.user.id;
                done();
            });
    });
});

describe('POST /api/login', () => {
    it('should return a login success response', (done) => {
        chai.request(server)
            .post('/api/login')
            .send({ "email": randomEmail, "password": randomPass })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('LOGIN_SUCCESS');

                expect(res.body.success).to.have.property('accessToken');
                expect(res.body.success).to.have.property('refreshToken');

                access_token = res.body.success.accessToken;
                refresh_token = res.body.success.refreshToken;
                done();
            });
    });
});

describe('POST /api/auth/confirmEmail', () => {
    it('should return a confirmed email response', (done) => {
        chai.request(server)
            .post('/api/auth/confirmEmail')
            .set({ "Authorization": `Bearer ${access_token}` })
            .send({ "emailToken": emailToken })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('EMAIL_CONFIRMED');
                done();
            });
    });
});

describe('POST /api/auth/token', () => {
    it('should return a success response and provide new access token', (done) => {
        chai.request(server)
            .post('/api/auth/token')
            .set({ "Authorization": `Bearer ${access_token}` })
            .send({ "refreshToken": refresh_token })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('ACCESS_TOKEN_GENERATED');

                expect(res.body.success).to.have.property('accessToken');

                access_token = res.body.success.accessToken;
                done();
            });
    });
});


describe('POST /api/resetPassword', () => {
    after(async () => {
        const user = await User.findOne({ email: randomEmail });
        PWD_reset_token = user.security.passwordReset.token;
    });

    it('should return a success response', (done) => {
        chai.request(server)
            .post('/api/resetPassword')
            .send({ "email": randomEmail, "provisionalPassword": randomPass.substring(2, 9).repeat(2) })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('PWD_RESET_EMAIL_SENT');
                done();
            });
    });
});

describe('POST /api/confirmResetPassword', () => {
    it('should return a successful reset password response', (done) => {
        chai.request(server)
            .post('/api/confirmResetPassword')
            .send({ "passwordResetToken": PWD_reset_token, "email": randomEmail })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('PWD_RESET');
                done();
            });
    });
});

describe('POST /api/changeEmail', () => {
    after(async () => {
        const user = await User.findOne({ email: randomEmail });
        email_reset_token = user.security.changeEmail.token;
    });

    it('should return a successful changeEmail response', (done) => {
        chai.request(server)
            .post('/api/changeEmail')
            .set({ "Authorization": `Bearer ${access_token}` })
            .send({ "provisionalEmail": changeRandomEmail  })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('CHANGE_EMAIL_SENT');
                done();
            });
    });
});

describe('POST /api/changeEmailConfirm', () => {
    it('should return a successful confirmed change email response', (done) => {
        chai.request(server)
            .post('/api/changeEmailConfirm')
            .set({ "Authorization": `Bearer ${access_token}` })
            .send({ "changeEmailToken": email_reset_token })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.have.property('status').to.equal(200);
                expect(res.body.success).to.have.property('message').to.equal('EMAIL_CHANGED');
                done();
            });
    });
});


after(async () => {
    try {
        await User.deleteOne({ _id: removeID });
    } catch (err) {
        console.error(err);
    }
});
