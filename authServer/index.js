var errors = require('./errors')
	, grantTypes = require('./grantTypes')
	, waitress = require('waitress')
	, oauthUtil = require('./util')
	, expiresIn
	, codeExpiresIn
	, deviceCodeExpiresIn
	, devicePollInterval
	, supportedScopes
	, deviceVerificationUri
	, includeRefreshToken
	, clientService
	, authorizationService
	, membershipService
	, tokenService;

exports.contextHelper = require('./context');

exports.config = function(_supportedScopes, _expiresIn, _deviceCodeExpiresIn, _devicePollInterval, _deviceVerificationUri, _codeExpiresIn, _includeRefreshToken) {
	supportedScopes = _supportedScopes;
	expiresIn = _expiresIn  || 3600;
	deviceCodeExpiresIn = _deviceCodeExpiresIn  || 600;
	devicePollInterval = _devicePollInterval  || 5;
	deviceVerificationUri = _deviceVerificationUri  || 'http://example.com';
	codeExpiresIn = _codeExpiresIn || 6000;
	includeRefreshToken = _includeRefreshToken = false;
}

exports.setServices = function(_clientService, _tokenService, _authorizationService, _membershipService) {
	clientService = _clientService;
	tokenService = _tokenService;
	authorizationService = _authorizationService;
	membershipService = _membershipService;
}

exports.authorizeRequest = function(context, userId, cb) {
	// Is there is a malformed request context?
	if (!context || !context.responseType)
		return cb(errors.invalidRequest(context.state));
	// Is there an allowed response type?
	else if (!oauthUtil.isAllowedResponseType(context.responseType))
		return cb(errors.unsupportedResponseType(context.state));

	// Find the requesting client
	clientService.getById(context.clientId, function(err, client) {
		if(err) return cb(err);
		authorizeRequestWithClient(client, context, userId, cb);
	});
};

// Gets the date to expire from now
exports.grantAccessToken = function(context, userId, cb) {
	if (!context.grantType)
		return cb(errors.invalidRequest(context.state));
	else if (!grantTypes.isAllowed(context.grantType, clientService, authorizationService, membershipService))
		return cb(errors.unsupportedGrantType(context.state));

	// Find the client that is acting on behalf of the user
	clientService.getById(context.clientId, function(err, client){
		if(err) return cb(err);

		// Is there a client?
		if (!client)
			return cb(errors.invalidClient(context));
		// Can this client have these grant types?
		else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType))
			return cb(errors.unsupportedGrantTypeForClient(context.state));

		// Does this require the client pass their secret? Is the secret valid?
		if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret)
			return callback(errors.clientCredentialsInvalid(context.state));

		// Get some token data finally!
		getTokenData(context, userId, function(error, tokenData){
			if(error) return cb(error);
			authorizationService.saveAccessToken(tokenData, function(saveError){
				if(saveError) return cb(saveError);
				cb(null, createTokenResponse(tokenData));
			});
		});
	});
};

exports.acceptDevice = function(userId, userCode, cb) {
	authorizationService.getUserCode(userCode, function(err, codeData) {
		if(err) return cb(err);
		var tokenData = generateTokenData(codeData.clientId, userId, codeData.scope, false);
		authorizationService.saveAccessToken(tokenData, function(saveError){
			if(saveError)	return cb(saveError);
			codeData.status = 'accepted';
			codeData.accessToken = tokenData.accessToken;
			authorizationService.updateUserCode(codeData, cb)
		});
	});
}

exports.declineDevice = function(userId, userCode, cb) {
	authorizationService.getUserCode(userCode, function(err, codeData) {
		if(err) return cb(err);
		var tokenData = generateTokenData(codeData.clientId, userId, codeData.scope, false);
		authorizationService.updateUserCode(codeData, cb)
	});
}

exports.deviceAuthStatus = function(context, cb) {
	if (!oauthUtil.isAllowedResponseType(context.responseType))
		return cb(errors.unsupportedResponseType(context.state));

	// Find the client that is acting on behalf of the user
	clientService.getById(context.clientId, function(err, client){
		if(err) return cb(err);

		// Is there a client?
		if (!client) return cb(errors.invalidClient(context));

		// Is the clients code valid?
		oauthUtil.isValidAuthorizationCode(context, authorizationService, function(codeError, isValid){
			if(codeError) return cb(codeError);
			if(!isValid) return cb(errors.invalidAuthorizationCode(context.state));

			// Find the usercode
			authorizationService.getUserCodeByCode(context.code, function(userCodeError, codeData) {
				if(userCodeError) return cb(userCodeError);
				if(!codeData)
					return cb(errors.deviceAuthorizationNotFound());
				if(codeData.status == 'pending')
					return cb(errors.deviceAuthorizationPending());
				if(codeData.status == 'declined')
					return cb(errors.deviceAuthorizationDeclined());
				if(codeData.status == 'accepted') {
					// get the access token
					authorizationService.getAccessToken(codeData.accessToken, function(tokenErr, tokenData){
						if(tokenErr) return cb(tokenErr);
						cb(null, createTokenResponse(tokenData));
					});
				} else {
					return cb(errors.deviceAuthorizationNotFound());
				}
			});
		});
	});
}

exports.validateAccessToken = function(context, cb) {
	authorizationService.getAccessToken(context.accessToken, function(err, tokenData){
		if(err) return cb(err);

		// Not found
		if (!tokenData || !tokenData.accessToken)
			cb(err, {
				isValid: false,
				error: 'Access token not found'
			});

		// Expired token
		if (oauthUtil.isExpired(tokenData.expiresDate)) 
			cb(err, {
				isValid: false,
				error: 'Access token has expired'
			});

		// Good to go
		cb(err, {isValid: true});
	});
};

function authorizeRequestWithClient(client, context, userId, cb) {

	// Is there a client to associate this with?
	if (!client)
		return cb(errors.invalidClient(context));
	// If not a device code, is there a redirect URI to go to when done?
	else if (!oauthUtil.isDeviceResponseType(context.responseType) && (!context.redirectUri || !client.isValidRedirectUri(context.redirectUri)))
		return cb(errors.redirectUriMismatch(context.state));
	// Do the scopes passed in fall withing the valid scopes?
	if (!isSupportedScope(context.scope))
		return cb(errors.invalidScope(context.state));

	// If is a device, and has a code, give a response
	if (oauthUtil.isDeviceResponseType(context.responseType) && context.code)
		return deviceAuthStatus(context, cb);

	// Generate all of the required stuff
	var token = oauthUtil.isTokenResponseType(context.responseType) ? tokenService.generateToken() : null
		, code = oauthUtil.isCodeResponseType(context.responseType) ? tokenService.generateToken() : null
		, userCode = oauthUtil.isDeviceResponseType(context.responseType) ? tokenService.generateUserCode() : null
		, todos = 0;
	if(code) todos++;
	if(token) todos++;
	if(userCode) todos++;

	// Because there may be multiple async items that need to be saved, wait until they are all done
	var done = waitress(todos, function(err) {
	  if (err) cb(err);
	  // If this is responding to a device code request
	  if(oauthUtil.isDeviceResponseType(context.responseType)) {
	  	cb(null, oauthUtil.buildDeviceCodeResponse(code, userCode, deviceVerificationUri, deviceCodeExpiresIn, devicePollInterval));
	  } else { // Responding to all other requests
		  cb(null, oauthUtil.buildAuthorizationUri(context, code, token, expiresIn));
	  }
	});

	// save user code
	if (code)
		saveCode(context, client, code, userId, done);
	// save token
	if (token)
		saveAccessToken(token, done);
	// save user code
	if (userCode)
		saveUserCode(context, client, code, userCode, done);
}

function deviceAuthStatus(context, cb) {
	cb('done', 'done')
}

// Formats and saves a user code request
function saveUserCode(context, client, code, userCode, cb) {
	authorizationService.saveUserCode({
		code: code,
		userCode: userCode,
		clientId: client.id,
		scope: context.scope,
		expiresIn: deviceCodeExpiresIn,
		interval: devicePollInterval,
		status: 'pending',
		verificationUri: deviceVerificationUri,
		expiresDate: getDeviceCodeExpiresDate()
	}, cb);
}

// Formats and saves an access token request
function saveAccessToken(token, cb) {
	authorizationService.saveAccessToken({
		accessToken: token,
		expiresDate: getExpiresDate()
	}, cb);
}

// Formats and saves a code request
function saveCode(context, client, code, userId, cb) {
	authorizationService.saveAuthorizationCode({
		code: code,
		redirectUri: context.redirectUri,
		clientId: client.id,
		timestamp: new Date(),
		expiresDate: getCodeExpiresDate(),
		userId: userId,
	}, cb);
}

// TODO, this function looks broken
function isSupportedScope(scope) {
	if (!supportedScopes)
		return true;
	if (!scope)
		return false;
	return true;
}
	
// Gets the date to expire from now
function getExpiresDate() {
	return new Date(new Date().getTime() + (expiresIn * 1000));
}

// Gets the date to expire from now
function getCodeExpiresDate() {
	return new Date(new Date().getTime() + (codeExpiresIn * 1000));
}

// Gets the date to expire from now for a device
function getDeviceCodeExpiresDate() {
	return new Date(new Date().getTime() + (deviceCodeExpiresIn * 1000));
}

// Finds the taken data for a user
function getTokenData(context, userId, cb) {
	var grantType = context.grantType.toLowerCase();
	
	// If Auth code
	if (grantType === grantTypes.authorizationCode) {
		// Check to see if the code is valid
		oauthUtil.isValidAuthorizationCode(context, authorizationService, function(err, isValid){
			if(err) return cb(err);
			if(!isValid) return cb(errors.invalidAuthorizationCode(context.state));
			return cb(null, generateTokenData(context.clientId, userId, context.scope, includeRefreshToken));
		});
	} 

	// If the grant type is IMPLICIT
	else if (grantType === grantTypes.implicit) {
		return cb(errors.cannotRequestImplicitToken(context.state));
	} 

	// If the grant type is PASSWORD
	else if (grantType === grantTypes.password) {
		membershipService.areUserCredentialsValid(userId, context.password, function(err, isValid){
			if(err) return cb(err);
			if(!isValid) return cb(errors.invalidUserCredentials(context.state));
			return cb(null, generateTokenData(context.clientId, userId, context.scope, includeRefreshToken));
		});
	}

	// If the grant type is client creds
	else if (grantType === grantTypes.clientCredentials) {
		return cb(null, generateTokenData(context.clientId, userId, context.scope, false));
	}

	// Not found, error out
	else {
		return cb(errors.unsupportedGrantType(context.state));
	}
};

function createTokenResponse(tokenData) {
	var response = {
		accessToken: tokenData.accessToken,
		expiresDate: tokenData.expiresDate
	};
	if(tokenService.refreshToken != undefined)
		response.refreshToken = tokenData.refreshToken;
	return response;
}

// Creates a token
function generateTokenData(clientId, userId, scope, includeRefresh) {
	// Create the token obj
	var tokenData = {
		accessToken: tokenService.generateToken(),
		expiresDate: getExpiresDate(),
		grantedDate: new Date(),
		scope: scope,
		userId: userId,
		clientId: clientId
	};
	
	// Should there be a refresh token
	if (includeRefresh)
			tokenData.refreshToken = self.tokenService.generateToken();
	return tokenData;
}