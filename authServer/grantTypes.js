var util = require('./util')
	, authorizationCode = 'authorization_code'
	, implicit = 'implict'
	, clientCredentials = 'client_credentials'
	, password = 'password'
	, device = 'device_code';

function isEmpty(item) {
	return !item || item.length === 0;
}

function requiresClientSecret(grantType) {
	if (isEmpty(grantType))
		return true;
	grantType = grantType.toLowerCase();
	return (grantType === authorizationCode) || (grantType === clientCredentials);
}

function isAllowed(grantType, clientService, authorizationService, membershipService) {
	if (isEmpty(grantType))
		return false;

	grantType = grantType.toLowerCase();

	if (grantType === implicit)
		return true;
	else if (grantType === authorizationCode && authorizationService)
		return true;
	else if (grantType === clientCredentials && clientService)
		return true;
	else if (grantType === password && membershipService)
		return true;
	else
		return false;
}

function isAllowedForClient(clientGrantTypes, grantType) {
	if (isEmpty(grantType))
		return false;

	return util.doesArrayContain(clientGrantTypes, grantType);
}

exports.authorizationCode = authorizationCode;
exports.implicit = implicit;
exports.clientCredentials = clientCredentials;
exports.password = password;
exports.requiresClientSecret = requiresClientSecret;
exports.isAllowed = isAllowed;
exports.isAllowedForClient = isAllowedForClient;