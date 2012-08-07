module.exports = function (req) {
	function getParam(paramName) {
		if (req.query && typeof req.query[paramName] !== 'undefined')
			return req.query[paramName];
		else if (req.body && typeof req.body[paramName] !== 'undefined')
			return req.body[paramName];
		else
			return null;
	};

	function getAccessToken() {
		if (!req || !req.headers || !req.headers.authorization)
			return null;

		var authHeader = req.headers.authorization,
		 	startIndex = authHeader.toLowerCase().indexOf('bearer ');

		if (startIndex === -1)
			return null;

		var bearer = authHeader.substring(startIndex + 7),
			spaceIndex = bearer.indexOf(' ');

		if (spaceIndex > 0)
			bearer = bearer.substring(0, spaceIndex);

		return bearer;
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
		accessToken: getAccessToken(),
		userName: getParam('username')
	} : null;
};