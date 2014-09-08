var errors = require('./errors'),
    url = require('url');

function buildAuthorizationUri(context, expiresIn, code, token) {
    var redirect = url.parse(context.redirect_uri, true);

    delete redirect.search;

    if (context.scope) {
        redirect.query.scope = context.scope.join(',');
    }

    if (context.state) {
        redirect.query.state = context.state;
    }

    if (expiresIn) {
        redirect.query.expires_in = expiresIn;
    }

    if (code) {
        redirect.query.code = code;
    }

    if (token) {
        redirect.query.access_token = token;
        redirect.query.token_type = 'Bearer';
    }

    return url.format(redirect);
}

function authorizeRequestWithClient(authServer, client, context, accountId, callback) {
    if (!client) {
        return callback(errors.invalidClient(context));
    }

    if (!context.redirect_uri || !authServer.clientService.isValidRedirectUri(client, context.redirect_uri)) {
        return callback(errors.redirectUriMismatch(context));
    }

    function finalResponse(error, data) {
        if(error){
            return callback(error);
        }

        callback(
            null,
            {
                redirectUri: buildAuthorizationUri(context, authServer.expiresIn, data.code, data.access_token),
                state: context
            }
        );
    }

    if (context.response_type === 'code') {
        authServer.tokenService.generateAuthorizationCode(function(error, code){
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAuthorizationCode({
                code: code,
                redirectUri: context.redirect_uri,
                clientId: client.id,
                expiresDate: authServer.getExpiresDate(),
                accountId: accountId
            }, finalResponse);

        });
        return;
    }

    if (context.response_type === 'token') {
        authServer.tokenService.generateToken(function(error, token){
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAccessToken({
                clientId: client.id,
                access_token: token,
                expires_in: authServer.getExpiresDate(),
                accountId: accountId,
                token_type: 'Bearer'
            }, finalResponse);
        });
        return;
    }

    callback(errors.invalidResponseType(context.state));
}

function authorizeRequest(context, accountId, callback) {
    var authServer = this;

    if (!context || !context.response_type) {
        return callback(errors.invalidRequest(context));
    }

    if (context.response_type !== 'token' && context.response_type !== 'code') {
        return callback(errors.unsupportedResponseType(context));
    }

    if (!authServer.isSupportedScope(context.scope)) {
        return callback(errors.invalidScope(context));
    }

    authServer.clientService.getById(context.client_id, function(error, client){
        if(error){
            return callback(error);
        }

        authorizeRequestWithClient(authServer, client, context, accountId, callback);
    });
}

module.exports = authorizeRequest;