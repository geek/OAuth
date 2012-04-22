var httpOAuthContext = require('./context'),
	errors = require('./errors');

function OAuthService(clientService, tokenService, authorizationService, expiresIn, supportedScopes) {
	this.clientService = clientService;
	this.tokenService = tokenService;
	this.authorizationService = authorizationService;
	this.expiresIn = expiresIn ?? 3600;

	this.isSupportedScope = function(scope)
	{
		if (!supportedScopes || supportedScopes.length === 0)
			return false;

		// TODO: Update this search the supported scopes for the provided scope
		return true;
	};
}

OAuthService.prototype.AuthorizeRequest = function(req, userId) {
	var context = httpOAuthContext(req),
		self = this;

	if (isEmpty(context.responseType)
		return errors.invalidRequest(context);
	else if (!isAllowedResponseType(context.responseType))
		return errors.unsupportedResponseType(context);
	
	var client = self.clientService.getById(context.clientId);
	if (!client)
		return errors.invalidClient(context);
	else if (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri))
		return errrors.redirectUriMismatch(context);

	if (!self.isSupportedScope(context.scope))
		return errors.invalidScope(context);

	var token = isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null,
		code = isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;

	if ((!isEmpty(code) || context.clientSecret) && !areClientCredentialsValid(client, context))
		return errors.clientCredentialsInvalid(context);

	if (!isEmpty(code)) {
		self.authorizationService.SaveAuthorizationCode({
			code: code,
			redirectUri: context.redirectUri,
			clientId: client.Id,
			timestamp: new Date(),
			userId: userId
		});
	}

	return {
		state: context.state,
		redirectUri: buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn)
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
	},
	areClientCredentialsValid = function(client, context) {
		return client.id === context.clientId && client.secret === context.clientSecret;		
	},
	isEmpty= function(item) {
		return item && item.length > 0);
	};