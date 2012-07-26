var httpOAuthContext = require('./context').httpOAuthContext,
	errors = require('./errors'),
	grantTypes = require('./grantTypes'),
	authUtil = require('./util');

function AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {
	this.clientService = clientService;
	this.tokenService = tokenService;
	this.authorizationService = authorizationService;
	this.membershipService = membershipService;
	this.expiresIn = expiresIn || 3600;

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
	else if (!authUtil.isAllowedResponseType(context.responseType))
		return callback(errors.unsupportedResponseType(context.state));
		
	var authorizeRequestWithClient = function(client) {
		if (!client)
			return callback(errors.invalidClient(context));
		else if (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri))
			return callback(errors.redirectUriMismatch(context.state));

		if (!self.isSupportedScope(context.scope))
			return callback(errors.invalidScope(context.state));

		var token = authUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null,
			code = authUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null,
			finalResponse = function() {
				var response = { 
					redirectUri: authUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn) 
				};
			
				if (context.state)
					response.state = context.state;

				return callback(response);
			};

		if (code)
			self.authorizationService.saveAuthorizationCode({
				code: code,
				redirectUri: context.redirectUri,
				clientId: client.id,
				timestamp: new Date(),
				userId: userId
			}, finalResponse);
		else if (token)
			self.authorizationService.saveAccessToken({
				accessToken: token,
				expiresDate: this.getExpiresDate()
			}, finalResponse);
	},
	next = function(client) {
		authorizeRequestWithClient(client);
	};

	self.clientService.getById(context.clientId, next);
};

AuthServer.prototype.getTokenData = function(context, callback) {
	var self = this,
		grantType = context.grantType.toLowerCase(),
		generateTokenDataRef = function(includeRefreshToken) {
			return authUtil.generateTokenData(includeRefreshToken, self.tokenService.generateToken, self.getExpiresDate);
		};

	if (grantType === grantTypes.authorizationCode) {
		authUtil.isValidAuthorizationCode(context, self.authorizationService, function(isValidAuthCode) {
			var tokenData = isValidAuthCode ? generateTokenDataRef(true) : errors.invalidAuthorizationCode(context.state);
			return callback(tokenData);
		});
	}
	else if (grantType === grantTypes.password) {
		self.membershipService.areUserCredentialsValid(context.userName, context.password, function(isValidPassword) {
			var tokenData = isValidPassword ? generateTokenDataRef(true) : errors.invalidUserCredentials(context.state);
			return callback(tokenData);
		});
	}
	else if (grantType === grantTypes.clientCredentials)
		return callback(generateTokenDataRef(false));
	else if (grantType === grantTypes.implicit)
		return callback(errors.cannotRequestImplicitToken(context.state));
	else
		return callback(errors.unsupportedGrantType(context.state));
};

AuthServer.prototype.grantAccessToken = function(req, userId, callback) {
	var self = this,
		context = httpOAuthContext(req);

	if (!context.grantType)
		return callback(errors.invalidRequest(context.state));
	else if (!grantTypes.isAllowed(context.grantType, self))
		return callback(errors.unsupportedGrantType(context.state));

	var next = function(client) {
		if (!client)
			return callback(errors.invalidClient(context));
		else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
			return callback(errors.unsupportedGrantTypeForClient(context.state));

		if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
			return callback(errors.clientCredentialsInvalid(context.state));

		return self.getTokenData(context, function(tokenData) {
			return tokenData.error ? callback(tokenData) : self.authorizationService.saveAccessToken(tokenData, function() {
				callback(tokenData)
			});
		});
	};
	
	self.clientService.getById(context.clientId, next);
};

AuthServer.prototype.validateAccessToken = function(req, callback) {
	var self = this,
		context = httpOAuthContext(req),
		response = { isValid: true };

	return self.authorizationService.getAccessToken(context.accessToken, function(tokenData) {
		if (!tokenData || !tokenData.accessToken)
			response = {
				isValid: false,
				error: 'Access token not found'
			};
		else if (authUtil.isExpired(tokenData.expiresDate)) 
			response = {
				isValid: false,
				error: 'Access token has expired'
			};
				
		return callback(response);
	});
};

exports.AuthServer = AuthServer;