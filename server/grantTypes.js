var util = require('./util');

exports = (function() {
	var authorizationCode = 'authorization_code',
		implicit = 'implict',
		clientCredentials = 'client_credentials',
		password = 'password';

	var isEmpty = function(item) {
		return !item || item.length === 0;
	};

	var requiresClientSecret = function(grantType) {
		if (isEmpty(grantType))
			return true;

		grantType = grantType.toLowerCase();
		
		return (grantType === authorizationCode) || (grantType === clientCredentials);
	};

	var isAllowed = function(grantType, oauthProvider) {
		if (isEmpty(grantType))
			return false;

		grantType = grantType.toLowerCase();

		if (grantType === implicit)
			return true;
		else if (grantType === authorizationCode && oauthProvider.authorizationService)
			return true;
		else if (grantType === clientCredentials && oauthProvider.clientService)
			return true;
		else if (grantType === password && oauthProvider.membershipService)
			return true;
		else
			return false;
	};

	var isAllowedForClient = function(clientGrantTypes, grantType) {
		if (isEmpty(grantType))
			return false;

		return util.doesArrayContain(clientGrantTypes, grantType);
	};

	return {
		authorizationCode: authorizationCode,
		implicit: implicit,
		clientCredentials: clientCredentials,
		password: password,
		requiresClientSecret: requiresClientSecret,
		isAllowed: isAllowed,
		isAllowedForClient: isAllowedForClient
	};
})();