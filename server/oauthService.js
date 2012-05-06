var httpOAuthContext = require('./context').httpOAuthContext,
	errors = require('./errors').errors;

exports.service = function(clientService, tokenService, authorizationService, expiresIn, supportedScopes) {
	expiresIn = expiresIn || 3600;

	var isSupportedScope = function(scope) {
		if (isEmpty(supportedScopes))
			return true;

		// TODO: Update this search the supported scopes for the provided scope
		return true;
	};

	return {
		authorizeRequest: function(req, userId) {
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
		}
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
	buildAuthorizationUri = function(redirectUri, code, token, scope, state, expiresIn) {
		var query = '';

		if (!isEmpty(code))
			query += 'code=' + code;
		if (!isEmpty(token))
			query += '&access_token=' + token;
		if (!isEmpty(expiresIn))
			query += "&expires_in=" + expiresIn;

		if (!isEmpty(scope)) {
			var scopeFormatted = "&scope=";
			for(var i = 0; i < scope.length; i++) {
				scopeFormatted += scope[i] + ',';
			}

			scopeFormatted = scopeFormatted.slice(0, scopeFormatted.length - 1);
			query += scopeFormatted;
		}

		if (!isEmpty(state))
			query += "&state=" + state;

		return redirectUri + "?" + query;
	},
	areClientCredentialsValid = function(client, context) {
		return client.id === context.clientId && client.secret === context.clientSecret;		
	},
	isEmpty= function(item) {
		return !item || item.length === 0;
	};