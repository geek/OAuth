var doesArrayContain = function(arrayList, item) {
	if (!arrayList)
		return false;
	
	var length = arrayList.length;

	for(var i = 0; i < length; i++) {
		if (arrayList[i] === item)
			return true;
	}

	return false;
},

isExpired = function(expiresDate) {
	return expiresDate < new Date();
},

isAllowedResponseType = function(responseType) {
	return isCodeResponseType(responseType) || isTokenResponseType(responseType);
},

isCodeResponseType = function(responseType) {
	return responseType === 'code' || responseType === 'code_and_token';
},

isTokenResponseType = function(responseType) {
	return responseType === 'token' || responseType === 'code_and_token';
},

isValidAuthorizationCode = function(context, authorizationService) {
	var authorizationCode = authorizationService.getAuthorizationCode(context.code);
	return authorizationCode && (context.code === authorizationCode.code) && !isExpired(authorizationCode.expiresDate);
},

buildAuthorizationUri = function(redirectUri, code, token, scope, state, expiresIn) {
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
},

areClientCredentialsValid = function(client, context) {
	return client.id === context.clientId && client.secret === context.clientSecret;		
};

exports.doesArrayContain = doesArrayContain;
exports.isExpired = isExpired;
exports.isAllowedResponseType = isAllowedResponseType;
exports.isCodeResponseType = isCodeResponseType;
exports.isTokenResponseType = isTokenResponseType;
exports.isValidAuthorizationCode = isValidAuthorizationCode;
exports.buildAuthorizationUri = buildAuthorizationUri;