var util = require('./util');

exports.authorizationCode = 'authorization_code';
exports.implicit = 'implict';
exports.clientCredentials = 'client_credentials';
exports.password = 'password';

exports.requiresClientSecret = function (grantType) {

    grantType = grantType ? grantType.toLowerCase() : grantType;

    return !grantType || (grantType === exports.authorizationCode) || (grantType === exports.clientCredentials);
};

exports.isAllowed = function (grantType, oauthProvider) {

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
};

exports.isAllowedForClient = function (clientGrantTypes, grantType) {

    return grantType ? util.doesArrayContain(clientGrantTypes, grantType) : false;
};