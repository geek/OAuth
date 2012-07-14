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
	return expiresDate < new Date().getTime();
},

isAllowedResponseType = function(responseType) {
	return isCodeResponseType(responseType) || isTokenResponseType(responseType) || isDeviceResponseType(responseType);
},

isCodeResponseType = function(responseType) {
	return responseType === 'code' || responseType === 'device_code' || responseType === 'code_and_token';
},

isTokenResponseType = function(responseType) {
	return responseType === 'token' || responseType === 'code_and_token';
},

isDeviceResponseType = function(responseType) {
	return responseType === 'device_code';
},

isValidAuthorizationCode = function(context, authorizationService, cb) {
	authorizationService.getAuthorizationCode(context.code, function(err, authorizationCode){
		if(err) return cb(err);
		if(authorizationCode == undefined) return cb(err, false);
		cb(err, authorizationCode && (context.code === authorizationCode.code) && !isExpired(authorizationCode.expiresDate));
	});
},

buildAuthorizationUri = function(context, code, token, expiresIn) {
	var query = '';

	if (code)
		query += 'code=' + code;
	if (token)
		query += '&access_token=' + token;
	if (expiresIn)
		query += '&expires_in=' + expiresIn;

	if (context.scope) {
		var scopeFormatted = '&scope=';
		for(var i = 0; i < context.scope.length; i++) {
			scopeFormatted += context.scope[i] + ',';
		}

		scopeFormatted = scopeFormatted.slice(0, scopeFormatted.length - 1);
		query += scopeFormatted;
	}

	if (context.state)
		query += '&state=' + context.state;

	return {
		redirect_uri: context.redirectUri + '?' + query,
		state: context.state
	}
},

buildDeviceCodeResponse = function(code, userCode, verificationUri, expiresIn, interval) {
	return {
		code: code,
		user_code: userCode,
		verification_uri: verificationUri,
		expires_in: expiresIn,
		interval: interval
	}	
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
exports.isDeviceResponseType = isDeviceResponseType;
exports.buildDeviceCodeResponse = buildDeviceCodeResponse;