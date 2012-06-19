var util = require('./util'),

authorizationCode = 'authorization_code',
implicit = 'implict',
clientCredentials = 'client_credentials',
password = 'password',

isEmpty = function(item) {
	return !item || item.length === 0;
},

requiresClientSecret = function(grantType) {
	if (isEmpty(grantType))
		return true;

	grantType = grantType.toLowerCase();
	
	return (grantType === authorizationCode) || (grantType === clientCredentials);
},

isAllowed = function(grantType, oauthProvider) {
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
},

isAllowedForClient = function(clientGrantTypes, grantType) {
	if (isEmpty(grantType))
		return false;

	return util.doesArrayContain(clientGrantTypes, grantType);
};

exports.authorizationCode = authorizationCode;
exports.implicit = implicit;
exports.clientCredentials = clientCredentials;
exports.password = password;
exports.requiresClientSecret = requiresClientSecret;
exports.isAllowed = isAllowed;
exports.isAllowedForClient = isAllowedForClient;