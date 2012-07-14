var oauth = require('../../app'),
	connect = require('connect'),
	util = require('util'),
	uuid = require('node-uuid');

var authCodes = {},
	userCodes = {},
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
		},
		generateUserCode: function() { 
			return Math.round(Math.random() * 100000) + '';
		}
	},
	authorizationService = {
		saveAuthorizationCode: function(codeData, cb) {
			authCodes[codeData.code] = codeData;
			cb(null, codeData);
		},
		saveUserCode: function(codeData, cb) {
			userCodes[codeData.userCode] = codeData;
			cb(null, codeData);
		},
		updateUserCode: function(codeData, cb) {
			userCodes[codeData.userCode] == codeData;
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
		},
		getUserCode: function(userCode, cb) {
			var userCode = userCodes[userCode];
			if(userCode == null) return cb(new Error('Invalid user code'));
			cb(null, userCode);
		},
		getUserCodeByCode: function(code, cb) {
			for(var i in userCodes){
				if(userCodes[i].code == code)
					return cb(null, userCodes[i]);
			};
			cb();
		}
	},
	membershipService = {
		areUserCredentialsValid: function(userId, password, cb) {
			cb(null, true);
		}
	},
	supportedScopes = [ 'profile', 'status', 'avatar'],
	expiresIn = 3600000,
	deviceCodeExpiresIn = 1,
	devicePollInterval = 5,
	includeRefreshToken = false,
	codeExpiresIn = 20,
	deviceVerificationUri = 'http://www.example.com';

// Setup the OAuth client
oauth.config(supportedScopes, expiresIn, deviceCodeExpiresIn, devicePollInterval, deviceVerificationUri, codeExpiresIn, includeRefreshToken);
oauth.setServices(clientService, tokenService, authorizationService, membershipService);

var authorize = function(req, res) {
	oauth.authorizeRequest(oauth.contextHelper(req), 'userid', function(err, result){
		if(err)
			res.write(util.inspect(err));
		else
			res.write(util.inspect(result));
		res.end();
	});
},
device = function(req, res) {
	var context = oauth.contextHelper(req);
	if(context.code == undefined) {
		oauth.authorizeRequest(context, 'userid', function(err, result){
			if(err)
				res.write(util.inspect(err));
			else
				res.write(util.inspect(result));
			res.end();
		});
	} else {
		oauth.deviceAuthStatus(context, function(err, result){
			if(err)
				res.write(util.inspect(err));
			else
				res.write(util.inspect(result));
			res.end();
		});
	}
},
grantToken = function(req, res) {
	oauth.grantAccessToken(oauth.contextHelper(req), 'userid', function(err, result){
		if(err)
			res.write(util.inspect(err));
		else
			res.write(util.inspect(result));
		res.end();
	});
},
authorizeDevice = function(req, res) {
	oauth.acceptDevice('userid', req.query.user_code + '', function(err, result){
		if(err)
			res.write(util.inspect(err));
		else
			res.write(util.inspect(result));
		res.end();
	});
},
apiEndpoint = function(req, res) {
	oauth.validateAccessToken(oauth.contextHelper(req), function(err, result){
		if(err)
			res.write(util.inspect(err));
		else
			res.write(util.inspect(result));
		res.end();
	});
};

var server = connect()
		.use(connect.query())
		.use(connect.bodyParser())
		.use('/oauth/authorize', authorize)
		.use('/oauth/token', grantToken)
		.use('/oauth/device', device)
		.use('/oauth/authorize_device', authorizeDevice)
		.use('/api/test', apiEndpoint).listen(8001);


// EXAMPLE REQUESTS

// Get a auth code
// http://localhost:8001/oauth/authorize?grant_type=authorization_code&client_id=1&client_secret=what&response_type=code&redirect_uri=http%3A%2F%2Fcnn.com

// Grant via a code
// http://localhost:8001/oauth/token?grant_type=authorization_code&client_id=1&client_secret=what&code=1beebb9f-4447-4a37-9bf6-12ec3f784b2f

// Test request with a valid token
// http://localhost:8001/api/test?access_token=4bbc931b-37f7-417d-9460-830cfbd3b084

// Request a device code
// http://localhost:8001/oauth/device?response_type=device_code&client_id=1

// User signs in and authorizes a device code
// http://localhost:8001/oauth/authorize_device?user_code=VERIFICATION_CODE
