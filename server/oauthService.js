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

Server.prototype.authorizeRequest = function(req, userId, cb) {
	var self = this,
		context = httpOAuthContext(req);
	if (!context || !context.responseType)
		return cb(errors.invalidRequest(context.state));
	else if (!oauthUtil.isAllowedResponseType(context.responseType))
		return cb(errors.unsupportedResponseType(context.state));
		

	var next = function(client) {
		self._authorizeRequest(req,userId,client,cb)
	}
	self.clientService.getById(context.clientId, next);

};

Server.prototype._authorizeRequest = function(req,userId,client,cb) {
	var self = this,
		context = httpOAuthContext(req);

	if (!client)
		return cb(errors.invalidClient(context));
	else if (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri))
		return cb(errors.redirectUriMismatch(context.state));

	if (!self.isSupportedScope(context.scope))
		return cb(errors.invalidScope(context.state));

	var token = oauthUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null,
		code = oauthUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;

	var next = function() {
		var authorizationUrl = oauthUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn);
		if (typeof cb == "function") {
			cb({
				redirectUri: authorizationUrl,
				state: context.state
			});
		}
	};

	if (code)
		self.authorizationService.saveAuthorizationCode({
			code: code,
			redirectUri: context.redirectUri,
			clientId: client.id,
			timestamp: new Date(),
			userId: userId
		},next);
	else if (token)
		self.authorizationService.saveAccessToken({
			accessToken: token,
			expiresDate: this.getExpiresDate(),
			clientId: client.id,
			timestamp: new Date(),
			userId: userId
		},next);

};

Server.prototype.grantAccessToken = function(req, userId,cb) {
	var self = this,
		context = httpOAuthContext(req);

	var getTokenData = function(tokenCallBack) {
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
			oauthUtil.isValidAuthorizationCode(context, self.authorizationService,function(codeData) {
				if (codeData)
					tokenCallBack(out);		
				else
					tokenCallBack(errors.invalidAuthorizationCode(context.state));
			});
		}
		else if (grantType === grantTypes.implicit)
			tokenCallBack(errors.cannotRequestImplicitToken(context.state));
		else if (grantType === grantTypes.password) {
			self.membershipService.areUserCredentialsValid(userId, context.password,function(valid) {
				if (valid)
					tokenCallBack(generateTokenData(true));
				else
					tokenCallBack(errors.invalidUserCredentials(context.state));
			});
		}
		else if (grantType === grantTypes.clientCredentials)
			tokenCallBack(generateTokenData(false));
		else
			tokenCallBack(errors.unsupportedGrantType(context.state));
	};

	if (!context.grantType)
		cb(errors.invalidRequest(context.state));
	else if (!grantTypes.isAllowed(context.grantType, self))
		cb(errors.unsupportedGrantType(context.state));
	

	var tokenData={};
	var done = function() {
		cb(tokenData);
	};

	var tokenDataCallback = function(token) {
		tokenData = token;
		if (!tokenData.error)
			self.authorizationService.saveAccessToken(token,done);
	};
	
	var clientServiceCallback = function(client) {
		if (!client)
			cb(errors.invalidClient(context));
		else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
			cb(errors.unsupportedGrantTypeForClient(context.state));

		if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
			cb(errors.clientCredentialsInvalid(context.state));
		
		getTokenData(tokenDataCallback);
	};
	self.clientService.getById(context.clientId,clientServiceCallback);
};

Server.prototype.validateAccessToken = function(req,cb) {
	var self = this,
		context = httpOAuthContext(req);

	var next = function(tokenData) {
		if (!tokenData || !tokenData.accessToken)
			cb({
				isValid: false,
				error: 'Access token not found'
			});
		else if (oauthUtil.isExpired(tokenData.expiresDate)) 
			cb({
				isValid: false,
				error: 'Access token has expired'
			});
		else 
			cb({
				isValid: true,
				data:tokenData
			});
	};
	self.authorizationService.getAccessToken(context.accessToken,next);
};

exports.Server = Server;