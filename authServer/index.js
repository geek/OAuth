var httpOAuthContext = require('./context').httpOAuthContext,
	errors = require('./errors').errors,
	grantTypes = require('./grantTypes'),
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

		var token = oauthUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null,
			code = oauthUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;

		if (code)
			self.authorizationService.saveAuthorizationCode({
				code: code,
				redirectUri: context.redirectUri,
				clientId: client.id,
				timestamp: new Date(),
				userId: userId
			});
		else if (token)
			self.authorizationService.saveAccessToken({
				accessToken: token,
				expiresDate: this.getExpiresDate()
			});

		var response = { 
				redirectUri: oauthUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn) 
			};
		
		if (context.state)
			response.state = context.state;

		callback(response);
	},
	next = function(client) {
		authorizeRequestWithClient(client);
	};

	self.clientService.getById(context.clientId, next);
};

AuthServer.prototype.grantAccessToken = function(req, userId, callback) {
	var self = this,
		context = httpOAuthContext(req);

	if (!context.grantType)
		return callback(errors.invalidRequest(context.state));
	else if (!grantTypes.isAllowed(context.grantType, self))
		return callback(errors.unsupportedGrantType(context.state));

	var getTokenData = function() {
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
			if (oauthUtil.isValidAuthorizationCode(context, self.authorizationService))
				return generateTokenData(true);
			else
				return errors.invalidAuthorizationCode(context.state);
		}
		else if (grantType === grantTypes.implicit)
			return errors.cannotRequestImplicitToken(context.state);
		else if (grantType === grantTypes.password) {
			if (self.membershipService.areUserCredentialsValid(userId, context.password))
				return generateTokenData(true);
			else
				return errors.invalidUserCredentials(context.state);
		}
		else if (grantType === grantTypes.clientCredentials)
			return generateTokenData(false);
		
		return errors.unsupportedGrantType(context.state);
	}, 
	next = function(client) {
		if (!client)
			return callback(errors.invalidClient(context));
		else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
			return callback(errors.unsupportedGrantTypeForClient(context.state));

		if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
			return callback(errors.clientCredentialsInvalid(context.state));

		var tokenData = getTokenData();
		if (!tokenData.error)
			self.authorizationService.saveAccessToken(tokenData);
		
		return callback(tokenData);
	};
	
	self.clientService.getById(context.clientId, next);
};

AuthServer.prototype.validateAccessToken = function(req) {
	var self = this,
		context = httpOAuthContext(req),
		tokenData = self.authorizationService.getAccessToken(context.accessToken),
		response = { isValid: true };

	if (!tokenData || !tokenData.accessToken)
		response = {
			isValid: false,
			error: 'Access token not found'
		};
	else if (oauthUtil.isExpired(tokenData.expiresDate)) 
		response = {
			isValid: false,
			error: 'Access token has expired'
		};
			
	return response;
};

exports.AuthServer = AuthServer;