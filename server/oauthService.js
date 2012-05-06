var httpOAuthContext = require('./context').httpOAuthContext,
	errors = require('./errors').errors,
	grantTypes = require('./grantTypes').grantTypes;

exports.service = function(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {
	var service = this;
	service.clientService = clientService;
	service.tokenService = tokenService;
	service.authorizationService = authorizationService;
	service.membershipService = membershipService;
	service.expiresIn = expiresIn = expiresIn || 3600;

	var isSupportedScope = function(scope) {
		if (isEmpty(supportedScopes))
			return true;

		// TODO: Update this search the supported scopes for the provided scope
		return true;
	};

	var authorizeRequest = function(req, userId) {
		var context = httpOAuthContext(req);

		if (isEmpty(context.responseType))
			return errors.invalidRequest(context.state);
		else if (!isAllowedResponseType(context.responseType))
			return errors.unsupportedResponseType(context.state);
			
		var client = clientService.getById(context.clientId);
		if (!client)
			return errors.invalidClient(context);
		else if (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri))
			return errors.redirectUriMismatch(context.state);

		if (!isSupportedScope(context.scope))
			return errors.invalidScope(context.state);

		var token = isTokenResponseType(context.responseType) ? tokenService.generateToken() : null,
			code = isCodeResponseType(context.responseType) ? tokenService.generateToken() : null;

		if (!isEmpty(code)) {
			authorizationService.saveAuthorizationCode({
				code: code,
				redirectUri: context.redirectUri,
				clientId: client.Id,
				timestamp: new Date(),
				userId: userId
			});
		}

		var authorizationUrl = buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, expiresIn);

		return {
			redirectUri: authorizationUrl,
			state: context.state
		};
	};

	var grantAccessToken = function(req, userId) {
		var context = httpOAuthContext(req);

		var getTokenData = function(context, oauthProvider) {
			var grantType = context.grantType.toLowerCase();
			var generateTokenData = function(includeRefreshToken) {
				var tokenData = {
						accessToken: oauthProvider.tokenService.generateToken(),
						expiresIn: service.expiresIn
					};

				if (includeRefreshToken)
					tokenData.refreshToken = oauthProvider.tokenService.generateToken();
				
				return tokenData;
			};

			if (grantType === grantTypes.authorizationCode) {
				if (isValidAuthorizationCode(context, service))
					return generateTokenData(true);
				else
					return errors.invalidAuthorizationCode(context.state);
			}
			else if (grantType === grantTypes.implicit)
				return errors.cannotRequestImplicitToken(context.state);
			else if (grantType === grantTypes.password) {
				if (membershipService.areUserCredentialsValid(userId, context.password))
					return generateTokenData(true);
				else
					return errors.invalidUserCredentials(context.state);
			}
			else if (grantType === grantTypes.clientCredentials)
				return generateTokenData(false);
			
			return errors.unsupportedGrantType(context.state);
		};

		if (isEmpty(context.grantType))
			return errors.invalidRequest(context.state);
		else if (!grantTypes.isAllowed(context.grantType, service))
			return errors.unsupportedGrantType(context.state);
		
		var client = clientService.getById(context.clientId);
		if (!client)
			return errors.invalidClient(context);
		else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
			return errors.unsupportedGrantTypeForClient(context.state);

		if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
			return errors.clientCredentialsInvalid(context.state);

		var tokenData = getTokenData(context, service);
		if (!tokenData.error)
			service.authorizationService.saveAccessToken(tokenData);
		
		return tokenData;
	};

	return {
		authorizeRequest: authorizeRequest,
		grantAccessToken: grantAccessToken
	};
};

var isAllowedResponseType = function(responseType) {
		return isCodeResponseType(responseType) || isTokenResponseType(responseType);
	},
	isCodeResponseType = function(responseType) {
		return responseType === 'code' || responseType === 'code_and_token';
	},
	isTokenResponseType = function(responseType) {
		return responseType === 'token' || responseType === 'code_and_token';
	},
	isValidAuthorizationCode = function(context, oauthProvider) {
		var authorizationCode = oauthProvider.authorizationService.getAuthorizationCode(context.code);
		
		return authorizationCode && (context.code === authorizationCode.code) && !isExpired(authorizationCode.expiresDate);
	},
	isExpired = function(expiresDate) {
		return expiresDate < new Date();
	},
	buildAuthorizationUri = function(redirectUri, code, token, scope, state, expiresIn) {
		var query = '';

		if (!isEmpty(code))
			query += 'code=' + code;
		if (!isEmpty(token))
			query += '&access_token=' + token;
		if (!isEmpty(expiresIn))
			query += '&expires_in=' + expiresIn;

		if (!isEmpty(scope)) {
			var scopeFormatted = '&scope=';
			for(var i = 0; i < scope.length; i++) {
				scopeFormatted += scope[i] + ',';
			}

			scopeFormatted = scopeFormatted.slice(0, scopeFormatted.length - 1);
			query += scopeFormatted;
		}

		if (!isEmpty(state))
			query += '&state=' + state;

		return redirectUri + '?' + query;
	},
	areClientCredentialsValid = function(client, context) {
		return client.id === context.clientId && client.secret === context.clientSecret;		
	},
	isEmpty= function(item) {
		return !item || item.length === 0;
	};