exports.isValidAuthorizationCode = function(context, authorizationService, callback) {
	/*
		Validate the code is present, matches the stored one, and the clientId's match across requests
	 */
	authorizationService.getAuthorizationCode(context.code, function(authorizationCode) {
		return callback(authorizationCode 
					&& (context.code === authorizationCode.code) 
					&& !exports.isExpired(authorizationCode.expiresDate)
					&& context.clientId === authorizationCode.clientId);
	});
};

exports.generateTokenData = function(userId, clientId, includeRefreshToken, generateToken, getExpiresDate) {
	var tokenData = {
			access_token: generateToken(),
			token_type: 'bearer',
			expires_in: getExpiresDate(),
			userId:userId,
			clientId:clientId
		};

	if (includeRefreshToken)
		tokenData.refresh_token = generateToken();
	
	return tokenData;
};

exports.doesArrayContain = function(arrayList, item) {
	if (!arrayList)
		return false;
	
	for(var i = 0, length = arrayList.length; i < length; i++) {
		if (arrayList[i] === item)
			return true;
	}

	return false;
};

exports.isExpired = function(expiresDate) {
	return expiresDate < new Date();
};

exports.isAllowedResponseType = function(responseType) {
	return exports.isCodeResponseType(responseType) || exports.isTokenResponseType(responseType);
};

exports.isCodeResponseType = function(responseType) {
	return responseType === 'code' || responseType === 'code_and_token';
};

exports.isTokenResponseType = function(responseType) {
	return responseType === 'token' || responseType === 'code_and_token';
};

exports.buildAuthorizationUri = function(redirectUri, code, token, scope, state, expiresIn) {
	var query = '';

	if (code)
		query += 'code=' + code;
	if (token)
		query += '&access_token=' + token;
	if (expiresIn)
		query += '&expires_in=' + expiresIn;

	if (scope) {
		var scopeFormatted = '&scope=';
		for(var i = 0, len = scope.length; i < len; i++) {
			scopeFormatted += scope[i] + ',';
		}

		if (scopeFormatted[scopeFormatted.length] === ',')
			scopeFormatted = scopeFormatted.slice(0, scopeFormatted.length - 1);
		
		query += scopeFormatted;
	}

	if (state)
		query += '&state=' + state;

	return redirectUri + '?' + query;
};

exports.areClientCredentialsValid = function(client, context) {
	return client.id === context.clientId && client.secret === context.clientSecret;		
};