var errors = require('./errors'),
    getTokenData = require('./getTokenData'),
    grantTypes = require('./grantTypes');

function isAllowed(grantType, oauthProvider) {
    return grantType === grantTypes.IMPLICIT ||
        (grantType === grantTypes.AUTHORIZATIONCODE && oauthProvider.authorizationService) ||
        (grantType === grantTypes.CLIENTCREDENTIALS && oauthProvider.clientService) ||
        (grantType === grantTypes.PASSWORD && oauthProvider.membershipService) ||
        false;
}

function grantAccessToken(context, callback) {
    var authServer = this;

    if (!context.grant_type) {
        return callback(errors.invalidRequest(context));
    }

    if (!isAllowed(context.grant_type, authServer)) {
        return callback(errors.unsupportedGrantType(context));
    }

    authServer.clientService.getById(context.client_id, function (error, client) {
        if(error){
            return callback(error);
        }

        if(!client) {
            return callback(errors.invalidClient(context));
        }

        if(!client.grantTypes || !~client.grantTypes.indexOf(context.grant_type)) {
            return callback(errors.unsupportedGrantTypeForClient(context));
        }

        if(
            (
                context.grant_type === grantTypes.AUTHORIZATIONCODE ||
                context.grant_type === grantTypes.CLIENTCREDENTIALS
            ) &&
            context.client_secret !== client.secret
        ){
            return callback(errors.clientCredentialsInvalid(context));
        }

        getTokenData.call(authServer, context, function (error, tokenData) {
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAccessToken(tokenData, function (error, token) {
                if(error){
                    return callback(error);
                }

                delete token.accountId;
                delete token.clientId;
                callback(null, token);
            });
        });
    });
}

module.exports = grantAccessToken;