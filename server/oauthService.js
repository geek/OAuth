var httpOAuthContext = require('./context').httpOAuthContext,
	errors = require('./errors').errors,
	grantTypes = require('./grantTypes'),
	oauthUtil = require('./util');

function Server(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {
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

Server.prototype.authorizeRequest = function(req, userId) {
	var self = this,
		context = httpOAuthContext(req);

	if (!context || !context.responseType)
		return errors.invalidRequest(context.state);
	else if (!oauthUtil.isAllowedResponseType(context.responseType))
		return errors.unsupportedResponseType(context.state);
		
	var client = self.clientService.getById(context.clientId);
	if (!client)
		return errors.invalidClient(context);
	else if (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri))
		return errors.redirectUriMismatch(context.state);

	if (!self.isSupportedScope(context.scope))
		return errors.invalidScope(context.state);

	var token = oauthUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null,
		code = oauthUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;

	if (!code)
		self.authorizationService.saveAuthorizationCode({
			code: code,
			redirectUri: context.redirectUri,
			clientId: client.Id,
			timestamp: new Date(),
			userId: userId
		});
	else if (!token)
		self.authorizationService.saveAccessToken({
			accessToken: token,
			expiresDate: this.getExpiresDate()
		});

	var authorizationUrl = oauthUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn);

	return {
		redirectUri: authorizationUrl,
		state: context.state
	};
};

Server.prototype.grantAccessToken = function(req, userId) {
	var self = this,
		context = httpOAuthContext(req);

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
	};

	if (!context.grantType)
		return errors.invalidRequest(context.state);
	else if (!grantTypes.isAllowed(context.grantType, self))
		return errors.unsupportedGrantType(context.state);
	
	var client = self.clientService.getById(context.clientId);
	if (!client)
		return errors.invalidClient(context);
	else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
		return errors.unsupportedGrantTypeForClient(context.state);

	if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
		return errors.clientCredentialsInvalid(context.state);

	var tokenData = getTokenData();
	if (!tokenData.error)
		self.authorizationService.saveAccessToken(tokenData);
	
	return tokenData;
};

Server.prototype.validateAccessToken = function(req) {
	var self = this,
		context = httpOAuthContext(req);

	var tokenData = self.authorizationService.getAccessToken(context.accessToken);

	if (!tokenData || !tokenData.accessToken)
		return {
			isValid: false,
			error: 'Access token not found'
		};

	if (util.isExpired(tokenData.expiresDate)) 
		return {
			isValid: false,
			error: 'Access token has expired'
		};

	return {
		isValid: true
	};
};

exports.Server = Server;