exports = exports.module = httpOAuthContext;

function httpOAuthContext(req)
{
	var getParam = function(paramName) {
		if (req.query[paramName])
			return req.query[paramName];
		else if (req.body[paramName])
			return req.body[paramName];
	};

	return {
		responseType: function() { return getParam('response_type'); },
		clientId: function() { return getParam('client_id'); },
		clientSecret: function() { return getParam('client_secret'); },
		code: function() { return getParam('code'); },
		grantType: function() { return getParam('grant_type'); },
		state: function() { return getParam('state'); },
		scope: function() {  
					var queryScope = getParam('scope');
					return queryScope ? queryScope.split(',') : []; 
				},
		redirectUri: function() { return getParam('redirect_uri'); }
	};
};