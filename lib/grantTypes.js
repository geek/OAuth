var util = require('./util');

function requiresClientSecret(grantType) {
    grantType = grantType ? grantType.toLowerCase() : grantType;

    return !grantType || (grantType === exports.authorizationCode) || (grantType === exports.clientCredentials);
}

function isAllowed(grantType, oauthProvider) {
    if (!grantType) {
        return false;
    }

    grantType = grantType.toLowerCase();

    if (grantType === exports.implicit) {
        return true;
    }
    else if (grantType === exports.authorizationCode && oauthProvider.authorizationService) {
        return true;
    }
    else if (grantType === exports.clientCredentials && oauthProvider.clientService) {
        return true;
    }
    else if (grantType === exports.password && oauthProvider.membershipService) {
        return true;
    }

    return false;
}

function isAllowedForClient(clientGrantTypes, grantType) {
    return grantType ? util.doesArrayContain(clientGrantTypes, grantType) : false;
}

module.exports = {
    password: 'password',
    implicit: 'implict',
    authorizationCode: 'authorization_code',
    clientCredentials: 'client_credentials',
    requiresClientSecret: requiresClientSecret,
    isAllowed: isAllowed,
    isAllowedForClient: isAllowedForClient
};

