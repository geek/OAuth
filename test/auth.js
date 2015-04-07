// Load modules

var Code = require('code');
var Lab = require('lab');
var AuthServer = require('../lib/');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


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