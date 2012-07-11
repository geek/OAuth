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
		getById: function(id, cb) {
			cb(null, clients[id]);
		}
	},
	tokenService = {
		generateToken: function() { 
			return uuid.v4(); 
		}
	},
	authorizationService = {
		saveAuthorizationCode: function(codeData, cb) {
			authCodes[codeData.code] = codeData;
			cb(null, codeData);
		},
		saveAccessToken: function(tokenData, cb) {
			accessTokens[tokenData.accessToken] = tokenData;
			cb(null, tokenData);
		},
		getAuthorizationCode: function(code, cb) {
			cb(null, authCodes[code]); 
		},
		getAccessToken: function(token, cb) {
			cb(null, accessTokens[token]);
		}
	},
	membershipService = {
		areUserCredentialsValid: function(userId, password, cb) {
			cb(null, true);
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 36000000000,
	authServer = new oauth.AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);

var authorize = function(req, res) {
	authServer.authorizeRequest(req, 'userid', function(err, result){
		res.write(util.inspect(result));
		res.end();
	});		
},
grantToken = function(req, res) {
	authServer.grantAccessToken(req, 'userid', function(err, result){
		res.write(util.inspect(result));
		res.end();
	});
},
apiEndpoint = function(req, res) {
	authServer.validateAccessToken(req, function(err, result){
		res.write(util.inspect(result));
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

// http://localhost:8001/oauth/authorize?grant_type=authorization_code&client_id=1&client_secret=what&response_type=code&redirect_uri=http%3A%2F%2Fcnn.com
// http://localhost:8001/oauth/token?grant_type=authorization_code&client_id=1&client_secret=what&code=1beebb9f-4447-4a37-9bf6-12ec3f784b2f
// http://localhost:8001/api/test?access_token=4bbc931b-37f7-417d-9460-830cfbd3b084