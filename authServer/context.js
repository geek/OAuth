module.exports = function(req) {
	var scope = getParam('scope');
	scope = scope && scope.length > 0 ? scope.split(',') : [];
	function getParam(paramName) {
		if (typeof req.query[paramName] !== undefined)
			return req.query[paramName];
		else if (typeof req.body[paramName] !== undefined)
			return req.body[paramName];
		else
			return '';
		};
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