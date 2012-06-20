var oauth = require('../../app'),
	connect = require('connect'),
	util = require('util'),
	uuid = require('node-uuid');

var authCodes = {},
	accessTokens = {},
	clients = {
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
		saveAuthorizationCode: function(codeDate) {
			authCodes[codeData.code] = codeData;
		},
		saveAccessToken: function(tokenData) {
			accessTokens[tokenData.accessToken] = tokenData;
		},
		getAuthorizationCode: function(code) {
			return authCodes[code]; 
		},
		getAccessToken: function(token) {
			console.log(util.inspect(accessTokens));
			
			return accessTokens[token];
		}
	},
	membershipService = {
		areUserCredentialsValid: function(userId, password) {
			return true;
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 3600,
	authServer = new oauth.AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);

var authorize = function(req, res) {
		var oauthUri = authServer.authorizeRequest(req, 'userid');
		res.write(util.inspect(oauthUri));
		res.end();
	},
	grantToken = function(req, res) {
		var token = authServer.grantAccessToken(req, 'userid');
		res.write(util.inspect(token));
		res.end();
	},
	apiEndpoint = function(req, res) {
		var validationResponse = authServer.validateAccessToken(req);
		res.write(util.inspect(validationResponse));
		res.end();
	};

var server = connect()
		.use(connect.query())
		.use(connect.bodyParser())
		.use('/oauth/authorize', authorize)
		.use('/oauth/token', grantToken)
		.use('/api/test', apiEndpoint).listen(8001);

console.log('listening on port 8001');