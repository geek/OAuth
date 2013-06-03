// Load modules

var Lab = require('lab');
var Util = require('../lib/util');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('doesArrayContain', function () {

    var testArray = ['item1', 'item2', 'item3', 'item4'];
    var itemNotInArray = 'item5';
    var itemInArray = 'item3';

    it('returns true when an array contains an expected item', function (done) {

        expect(Util.doesArrayContain(testArray, itemInArray)).to.be.true;
        done();
    });

    it('returns false when an array does not contain the expected item', function (done) {

        expect(Util.doesArrayContain(testArray, itemNotInArray)).to.be.false;
        done();
    });

    it('returns false when a null array is passed in', function (done) {

        expect(Util.doesArrayContain(null, itemNotInArray)).to.be.false;
        done();
    });

    it('returns false when an undefined array is passed in', function (done) {

        expect(Util.doesArrayContain(null, itemNotInArray)).to.be.false;
        done();
    });

    it('returns false when a null item passed in', function (done) {

        expect(Util.doesArrayContain(testArray, null)).to.be.false;
        done();
    });

    it('returns false when an undefined item passed in', function (done) {

        expect(Util.doesArrayContain(testArray, undefined)).to.be.false;
        done();
    });
});

describe('buildAuthorizationUri', function () {

    var redirectUri = 'http://google.com';
    var code = 'myCode';
    var token = 'myToken';
    var scope = ['scope1', 'scope2', 'scope3'];
    var state = 'randomstate';
    var expiresIn = new Date();

    it('contains the passed in redirect URI', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, code, token, scope, state, expiresIn)).to.contain(redirectUri);
        done();
    });

    it('does not have a code param when a null code is passed in', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, null, token, scope, state, expiresIn)).to.not.contain('code');
        done();
    });

    it('does not have a token param when a null token is passed in', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, code, null, scope, state, expiresIn)).to.not.contain('token');
        done();
    });

    it('does not have a token or code when both are null', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, null, null, scope, state, expiresIn)).to.not.contain('token');
        done();
    });

    it('does not throw an error when a null scope is passed in', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, code, token, null, state, expiresIn)).to.be.ok;
        done();
    });

    it('does not throw an error when a null state is passed in', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, code, token, scope, null, expiresIn)).to.be.ok;
        done();
    });

    it('does not throw an error when a null expires time is passed in', function (done) {

        expect(Util.buildAuthorizationUri(redirectUri, code, token, scope, state, null)).to.be.ok;
        done();
    });
});