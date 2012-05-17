var oauth = require('../server/oauthService.js'),
	connect = require('connect'),
	util = require('util'),
	uuid = require('node-uuid');

var clients = {
		'1': {
			id: '1',
			secret: 'what',
			grantTypes: ['implicit', 'password', 'client_credentials', 'authorization_code'],
			isValidRedirectUri: function(uri) { return true; }
		}
	},
	clientService = {
		getById: function(id) {
			return clients[id];
		}
	},
	tokenService = {
		generateToken: function() { 
			return uuid.v4(); 
		}
	},
	authorizationService = {
		saveAuthorizationCode: function(code) {

		},
		saveAccessToken: function(token) {

		},
		getAuthorizationCode: function(codeId) {
			return {
				code: uuid.v4(),
				expiresDate: new Date()
			};
		}
	},
	membershipService = {
		areUserCredentialsValid: function(usernId, password) {
			return true;
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 3600,
	service = oauth.service(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);

var authorize = function(req, res) {
		var oauthUri = service.authorizeRequest(req, 'userid');
		res.write(util.inspect(oauthUri));
		res.end();
	},
	grantToken = function(req, res) {
		var token = service.grantAccessToken(req, 'userid');
		res.write(util.inspect(token));
		res.end();
	};

var server = connect()
		.use(connect.query())
		.use(connect.bodyParser())
		.use('/oauth/authorize', authorize)
		.use('/oauth/token', grantToken).listen(8001);

console.log('listening on port 8001');