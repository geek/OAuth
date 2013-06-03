// Load modules

var Lab = require('lab');
var AuthServer = require('../lib/');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('AuthServer', function () {

    it('all functions are accessible', function (done) {

        var auth = new AuthServer();

        expect(typeof auth.authorizeRequest).to.equal('function');
        expect(typeof auth.getDeviceCode).to.equal('function');
        expect(typeof auth.getTokenData).to.equal('function');
        expect(typeof auth.grantAccessToken).to.equal('function');
        expect(typeof auth.validateAccessToken).to.equal('function');

        done();
    });
});