// Load modules

var Code = require('code');
var Lab = require('lab');
var Context = require('../lib/context');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('context', function () {

    var completeRequest = {
        query: {
            response_type: 'myresponsetype',
            client_id: '2',
            client_secret: 'mysecret',
            code: 'mycode',
            grant_type: 'mygranttype',
            state: 'mystate',
            password: 'mypassword',
            scope: 'scope1,scope2,scope3',
            redirect_uri: 'http://someredirect.com',
            username: 'test'
        },
        headers: {
            authorization: 'Authorization: Bearer myaccesstoken'
        }
    };

    it('returns null when an invalid request is passed in', function (done) {

        expect(Context(null)).to.be.null;
        done();
    });

    it('has null properties when an empty request is passed in', function (done) {

        expect(Context({}).clientId).to.be.null;
        done();
    });

    it('has the correct response type with a complete request', function (done) {

        expect(Context(completeRequest).responseType).to.equal('myresponsetype');
        done();
    });

    it('has the correct client ID with a complete request', function (done) {

        expect(Context(completeRequest).clientId).to.equal('2');
        done();
    });

    it('has the correct client secret with a complete request', function (done) {

        expect(Context(completeRequest).clientSecret).to.equal('mysecret');
        done();
    });

    it('has the correct code with a complete request', function (done) {

        expect(Context(completeRequest).code).to.equal('mycode');
        done();
    });

    it('has the correct grant type with a complete request', function (done) {

        expect(Context(completeRequest).grantType).to.equal('mygranttype');
        done();
    });

    it('has the correct state with a complete request', function (done) {

        expect(Context(completeRequest).state).to.equal('mystate');
        done();
    });

    it('has the correct password with a complete request', function (done) {

        expect(Context(completeRequest).password).to.equal('mypassword');
        done();
    });

    it('has the correct scope with a complete request', function (done) {

        var scope = Context(completeRequest).scope;

        expect(scope[0]).to.equal('scope1');
        expect(scope[1]).to.equal('scope2');
        expect(scope[2]).to.equal('scope3');
        done();
    });

    it('has the correct redirect URI with a complete request', function (done) {

        expect(Context(completeRequest).redirectUri).to.equal('http://someredirect.com');
        done();
    });

    it('has the correct access token with a complete request', function (done) {

        expect(Context(completeRequest).access_token).to.equal('myaccesstoken');
        done();
    });

    it('has the correct username with a complete request', function (done) {

        expect(Context(completeRequest).userName).to.equal('test');
        done();
    });
});