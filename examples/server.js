var oauth = require('../server/oauthService.js'),
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
		getById: function(id,next) {
			next(clients[id]);
		}
	},
	tokenService = {
		generateToken: function() { 
			return uuid.v4(); 
		}
	},
	authorizationService = {
		saveAuthorizationCode: function(codeDate, done) {
			authCodes[codeData.code] = codeData;
			done();
		},
		saveAccessToken: function(tokenData, done) {
			accessTokens[tokenData.accessToken] = tokenData;
			done();
		},
		getAuthorizationCode: function(code, next) {
			next(authCodes[code]); 
		},
		getAccessToken: function(token, next) {
			console.log(util.inspect(accessTokens));
			
			next(accessTokens[token]);
		}
	},
	membershipService = {
		areUserCredentialsValid: function(userId, password, next) {
			next(true);
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 3600,
	oauthServer = new oauth.Server(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);

var authorize = function(req, res) {
		oauthServer.authorizeRequest(req, 'userid', function(oauthUri) {
			res.write(util.inspect(oauthUri));
			res.end();
		});
	},
	grantToken = function(req, res) {
		oauthServer.grantAccessToken(req, 'userid', function(token) {
			res.write(util.inspect(token));
			res.end();		
		});
	},
	apiEndpoint = function(req, res) {
		oauthServer.validateAccessToken(req, function(validationResponse) {
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