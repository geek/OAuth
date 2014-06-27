var util = require('./util'),
    password = 'password',
    implicit = 'implict',
    authorizationCode = 'authorization_code',
    clientCredentials = 'client_credentials';

function requiresClientSecret(grantType) {
    return grantType === authorizationCode || grantType === clientCredentials;
}

function isAllowed(grantType, oauthProvider) {
    if (grantType === implicit) {
        return true;
    }
    else if (grantType === authorizationCode && oauthProvider.authorizationService) {
        return true;
    }
    else if (grantType === clientCredentials && oauthProvider.clientService) {
        return true;
    }
    else if (grantType === password && oauthProvider.membershipService) {
        return true;
    }

    return false;
}

function isAllowedForClient(clientGrantTypes, grantType) {
    return util.doesArrayContain(clientGrantTypes, grantType);
}

module.exports = {
    password: password,
    implicit: implicit,
    authorizationCode: authorizationCode,
    clientCredentials: clientCredentials,
    requiresClientSecret: requiresClientSecret,
    isAllowed: isAllowed,
    isAllowedForClient: isAllowedForClient
};

