var util = require('util');

exports.httpOAuthContext = function (req)
{
	var getParam = function(paramName) {
		if (typeof req.query[paramName] !== undefined)
			return req.query[paramName];
		else if (typeof req.body[paramName] !== undefined)
			return req.body[paramName];
		else
			return '';
	};

	var scope = getParam('scope');
	scope = scope && scope.length > 0 ? scope.split(',') : [];

	return {
		responseType: getParam('response_type'),
		clientId: getParam('client_id'),
		clientSecret: getParam('client_secret'),
		code: getParam('code'),
		grantType: getParam('grant_type'),
		state: getParam('state'),
		password: getParam('password'),
		scope: scope,
		redirectUri: getParam('redirect_uri'),
		accessToken: getParam('access_token')
	};
};