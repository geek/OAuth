var expect = require('chai').expect,
	context = require('../authServer/context');

describe('context', function() {
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

	it ('returns null when an invalid request is passed in', function() {
		expect(context(null)).to.be.null;
	});

	it ('has null properties when an empty request is passed in', function() {
		expect(context({}).clientId).to.be.null;
	});

	it ('has the correct response type with a complete request', function() {
		expect(context(completeRequest).responseType).to.equal('myresponsetype');
	});

	it ('has the correct client ID with a complete request', function() {
		expect(context(completeRequest).clientId).to.equal('2');
	});

	it ('has the correct client secret with a complete request', function() {
		expect(context(completeRequest).clientSecret).to.equal('mysecret');
	});

	it ('has the correct code with a complete request', function() {
		expect(context(completeRequest).code).to.equal('mycode');
	});

	it ('has the correct grant type with a complete request', function() {
		expect(context(completeRequest).grantType).to.equal('mygranttype');
	});

	it ('has the correct state with a complete request', function() {
		expect(context(completeRequest).state).to.equal('mystate');
	});

	it ('has the correct password with a complete request', function() {
		expect(context(completeRequest).password).to.equal('mypassword');
	});

	it ('has the correct scope with a complete request', function() {
		var scope = context(completeRequest).scope;
		
		expect(scope[0]).to.equal('scope1');
		expect(scope[1]).to.equal('scope2');
		expect(scope[2]).to.equal('scope3');
	});

	it ('has the correct redirect URI with a complete request', function() {
		expect(context(completeRequest).redirectUri).to.equal('http://someredirect.com');
	});

	it ('has the correct access token with a complete request', function() {
		expect(context(completeRequest).accessToken).to.equal('myaccesstoken');
	});
	
	it ('has the correct username with a complete request', function() {
		expect(context(completeRequest).userName).to.equal('test');
	});
});