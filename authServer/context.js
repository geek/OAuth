exports.httpOAuthContext = function (req) {
	function getParam(paramName) {
		if (req.query && typeof req.query[paramName] !== undefined)
			return req.query[paramName];
		else if (req.body && typeof req.body[paramName] !== undefined)
			return req.body[paramName];
		else
			return null;
	};

	return req ? {
		responseType: getParam('response_type'),
		clientId: getParam('client_id'),
		clientSecret: getParam('client_secret'),
		code: getParam('code'),
		grantType: getParam('grant_type'),
		state: getParam('state'),
		password: getParam('password'),
		scope: getParam('scope') ? getParam('scope').split(',') : null,
		redirectUri: getParam('redirect_uri'),
		accessToken: getParam('access_token')
	} : null;
};