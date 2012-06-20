var doesArrayContain = function(arrayList, item) {
	var length = arrayList.length;

	for(var i = 0; i < length; i++) {
		if (arrayList[i] === item)
			return true;
	}

	return false;
},

getInArray = function(arrayList, id) {
	var length = arrayList.length;

	for(var i = 0; i < length; i++) {
		if (arrayList[i] === id)
			return arrayList[i];
	}

	return null;
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

isValidAuthorizationCode = function(context, authorizationService,cb) {
	authorizationService.getAuthorizationCode(context.code,function(authorizationCode) {
		cb(authorizationCode && (context.code === authorizationCode.code) && !isExpired(authorizationCode.expiresDate));
	});
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
		for(var i = 0; i < scope.length; i++) {
			scopeFormatted += scope[i] + ',';
		}

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