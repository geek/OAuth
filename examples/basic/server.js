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
		saveAuthorizationCode: function(codeData) {
			authCodes[codeData.code] = codeData;
		},
		saveAccessToken: function(tokenData) {
			accessTokens[tokenData.accessToken] = tokenData;
		},
		getAuthorizationCode: function(code) {
			return authCodes[code]; 
		},
		getAccessToken: function(token) {
			return accessTokens[token];
		}
	},
	membershipService = {
		areUserCredentialsValid: function(userId, password) {
			return true;
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 36000000000,
	authServer = new oauth.AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);

var authorize = function(req, res) {
		var oauthUri = authServer.authorizeRequest(req, 'userid');
		console.log('gothere finaly')
		console.log(oauthUri);
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

// http://localhost:8001/oauth/authorize?grant_type=authorization_code&client_id=1&client_secret=what&response_type=code&redirect_uri=http%3A%2F%2Fcnn.com
// http://localhost:8001/oauth/token?grant_type=authorization_code&client_id=1&client_secret=what&code=1beebb9f-4447-4a37-9bf6-12ec3f784b2f
// http://localhost:8001/api/test?access_token=4bbc931b-37f7-417d-9460-830cfbd3b084