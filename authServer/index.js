var httpOAuthContext = require('./context').httpOAuthContext,
	errors = require('./errors').errors,
	grantTypes = require('./grantTypes'),
	waitress = require('waitress'),
	oauthUtil = require('./util');

function AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {
	this.clientService = clientService;
	this.tokenService = tokenService;
	this.authorizationService = authorizationService;
	this.membershipService = membershipService;
	this.expiresIn = expiresIn  || 3600;

 	this.isSupportedScope = function(scope) {
		if (!supportedScopes)
			return true;

		if (!scope)
			return false;

		return true;
	};
	
	this.getExpiresDate = function() {
		return new Date(new Date().getTime() + expiresIn * 60000);
	};
};

AuthServer.prototype.authorizeRequest = function(req, userId, callback) {
	var self = this,
		context = httpOAuthContext(req);

	if (!context || !context.responseType)
		return callback(errors.invalidRequest(context.state));
	else if (!oauthUtil.isAllowedResponseType(context.responseType))
		return callback(errors.unsupportedResponseType(context.state));
		
	var authorizeRequestWithClient = function(client) {
		
		if (!client)
			return callback(errors.invalidClient(context));
		else if (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri))
			return callback(errors.redirectUriMismatch(context.state));

		if (!self.isSupportedScope(context.scope))
			return callback(errors.invalidScope(context.state));

		var token = oauthUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null
			, code = oauthUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;
			, todos = 0;
			
		if(code) todos++;
		if(token) todos++;

		var done = waitress(todos, function(err) {
		  if (err) callback(err);
		  var authorizationUrl = oauthUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn);
		  callback(null, {
				redirectUri: authorizationUrl,
				state: context.state
			})
		});

		if (code)
			self.authorizationService.saveAuthorizationCode({
				code: code,
				redirectUri: context.redirectUri,
				clientId: client.Id,
				timestamp: new Date(),
				userId: userId
			}, done);
		if (token)
			self.authorizationService.saveAccessToken({
				accessToken: token,
				expiresDate: self.getExpiresDate()
			}, done);
	};
	
	self.clientService.getById(context.clientId, function(err, client) {
		if(err) return callback(err);
		authorizeRequestWithClient(client);
	});
};

AuthServer.prototype.grantAccessToken = function(req, userId, callback) {
	var self = this,
		context = httpOAuthContext(req);

	var getTokenData = function(cb) {
		var grantType = context.grantType.toLowerCase();
		var generateTokenData = function(includeRefreshToken) {
			var tokenData = {
					accessToken: self.tokenService.generateToken(),
					expiresDate: self.getExpiresDate()
				};

			if (includeRefreshToken)
				tokenData.refreshToken = self.tokenService.generateToken();
			
			return tokenData;
		};

		if (grantType === grantTypes.authorizationCode) {
			oauthUtil.isValidAuthorizationCode(context, self.authorizationService, function(err, isValid){
				if(err) return cb(err);
				if(!isValid) return cb(errors.invalidAuthorizationCode(context.state));
				return cb(null, generateTokenData(true));
			});
		} else if (grantType === grantTypes.implicit) {
			return cb(errors.cannotRequestImplicitToken(context.state));
		} else if (grantType === grantTypes.password) {
			self.membershipService.areUserCredentialsValid(userId, context.password, function(err, isValid){
				if(err) return cb(err);
				if(!isValid) return cb(errors.invalidUserCredentials(context.state));
				return cb(null, generateTokenData(true));
			});
		} else if (grantType === grantTypes.clientCredentials) {
			return cb(null, generateTokenData(false));
		} else {
			return cb(errors.unsupportedGrantType(context.state));
		}
	};

	if (!context.grantType)
		return callback(errors.invalidRequest(context.state));
	else if (!grantTypes.isAllowed(context.grantType, self))
		return callback(errors.unsupportedGrantType(context.state));
	
	self.clientService.getById(context.clientId, function(err, client){
		if(err) return callback(err);

		if (!client)
			return callback(errors.invalidClient(context));
		else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
			return callback(errors.unsupportedGrantTypeForClient(context.state));

		if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
			return callback(errors.clientCredentialsInvalid(context.state));

		getTokenData(function(error, tokenData){
			if(error) return callback(error);
			self.authorizationService.saveAccessToken(tokenData, callback);
		});
	});
};

AuthServer.prototype.validateAccessToken = function(req, callback) {
	var context = httpOAuthContext(req);

	this.authorizationService.getAccessToken(context.accessToken, function(err, tokenData){
		if(err) return callback(err);
		if (!tokenData || !tokenData.accessToken)
			callback(err, {
				isValid: false,
				error: 'Access token not found'
			});
		if (oauthUtil.isExpired(tokenData.expiresDate)) 
			callback(err, {
				isValid: false,
				error: 'Access token has expired'
			});
		callback(err, {
			isValid: true
		})
	});
};

exports.AuthServer = AuthServer;