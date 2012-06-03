var expect = require('chai').expect,
	util = require('../authServer/util');

describe('doesArrayContain', function() {
	var testArray = ['item1', 'item2', 'item3', 'item4'],
		itemNotInArray = 'item5',
		itemInArray = 'item3';

	it ('returns true when an array contains an expected item', function() {
		expect(util.doesArrayContain(testArray, itemInArray)).to.be.true;
	});

	it ('returns false when an array does not contain the expected item', function() {
		expect(util.doesArrayContain(testArray, itemNotInArray)).to.be.false;
	});

	it ('returns false when a null array is passed in', function() {
		expect(util.doesArrayContain(null, itemNotInArray)).to.be.false;
	});

	it ('returns false when an undefined array is passed in', function() {
		expect(util.doesArrayContain(null, itemNotInArray)).to.be.false;
	});

	it ('returns false when a null item passed in', function() {
		expect(util.doesArrayContain(testArray, null)).to.be.false;
	});

	it ('returns false when an undefined item passed in', function() {
		expect(util.doesArrayContain(testArray, undefined)).to.be.false;
	});
});

describe('buildAuthorizationUri', function() {
	var redirectUri = 'http://google.com', 
		code = 'myCode', 
		token = 'myToken', 
		scope = ['scope1', 'scope2', 'scope3'], 
		state = 'randomstate', 
		expiresIn = new Date();

	it ('contains the passed in redirect URI', function() {
		expect(util.buildAuthorizationUri(redirectUri, code, token, scope, state, expiresIn)).to.contain(redirectUri);
	});

	it ('does not have a code param when a null code is passed in', function() {
		expect(util.buildAuthorizationUri(redirectUri, null, token, scope, state, expiresIn)).to.not.contain('code');
	});

	it ('does not have a token param when a null token is passed in', function() {
		expect(util.buildAuthorizationUri(redirectUri, code, null, scope, state, expiresIn)).to.not.contain('token');
	});

	it ('does not have a token or code when both are null', function() {
		expect(util.buildAuthorizationUri(redirectUri, null, null, scope, state, expiresIn)).to.not.contain('token');
	});

	it ('does not throw an error when a null scope is passed in', function() {
		expect(util.buildAuthorizationUri(redirectUri, code, token, null, state, expiresIn)).to.be.ok;
	});

	it ('does not throw an error when a null state is passed in', function() {
		expect(util.buildAuthorizationUri(redirectUri, code, token, scope, null, expiresIn)).to.be.ok;
	});

	it ('does not throw an error when a null expires time is passed in', function() {
		expect(util.buildAuthorizationUri(redirectUri, code, token, scope, state, null)).to.be.ok;
	});
});