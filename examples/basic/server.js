var oauth = require('auth-server'),
	connect = require('connect'),
	util = require('util'),
	uuid = require('node-uuid');

var authCodes = {},
	accessTokens = {},
	clients = {
		'1': {
			id: '1',
			secret: 'what',
			grantTypes: ['implicit', 'password', 'client_credentials', 'authorization_code']
		},
		'dummy': {
			id: 'dummy',
			secret: '',
			grantTypes: ['password']
		}
	},
	clientService = {
		getById: function(id, callback) {
			if (id === null) {
				return callback(clients['dummy']);
			} else {
				return callback(clients[id]);
			}
		},
		isValidRedirectUri: function(client,uri) { return true; }
	},
	tokenService = {
		generateToken: function() { 
			return uuid.v4(); 
		},
		generateDeviceCode: function() {
			return generateToken();
		}
	},
	authorizationService = {
		saveAuthorizationCode: function(codeData, callback) {
			authCodes[codeData.code] = codeData;
			return callback();
		},
		saveAccessToken: function(tokenData, callback) {
			accessTokens[tokenData.accessToken] = tokenData;
			return callback();
		},
		getAuthorizationCode: function(code, callback) {
			return callback(authCodes[code]); 
		},
		getAccessToken: function(token, callback) {
			return callback(accessTokens[token]);
		}
	},
	membershipService = {
		areUserCredentialsValid: function(userName, password, scope, callback) {
			return callback(true);
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 3600,
	authServer = new oauth.AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);

var authorize = function(req, res) {
		authServer.authorizeRequest(req, 'userid', function(response) {
			res.write(util.inspect(response));
			res.end();
		});
	},
	grantToken = function(req, res) {
		authServer.grantAccessToken(req, 'userid', function(token) {
			res.write(util.inspect(token));
			res.end();
		});
	},
	apiEndpoint = function(req, res) {
		authServer.validateAccessToken(req, function(validationResponse) {
			res.write(util.inspect(validationResponse));
			res.end();
		});
	};

var server = connect()
		.use(connect.query())
		.use(connect.bodyParser())
		.use('/oauth/authorize', authorize)
		.use('/oauth/token', grantToken)
		.use('/api/test', apiEndpoint).listen(8001);

console.log('listening on port 8001');