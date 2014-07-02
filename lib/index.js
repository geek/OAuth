var errors = require('./errors'),
    grantTypes = require('./grantTypes'),
    kgo = require('kgo'),
    utils = require('./util');

function AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {
    var authServer = this;

    if(!(authServer instanceof AuthServer)) {
        return new AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);
    }

    authServer.clientService = clientService;
    authServer.tokenService = tokenService;
    authServer.authorizationService = authorizationService;
    authServer.membershipService = membershipService;
    authServer.expiresIn = expiresIn || 3600;

    if(!supportedScopes){
        supportedScopes = [];
    }

    authServer.isSupportedScope = function (scopes) {
        if(!Array.isArray(scopes)){
            scopes = [scopes];
        }

        for(var i = 0; i < scopes.length; i++){
            if(!~supportedScopes.indexOf(scopes[i])){
                return false;
            }
        }
        return true;
    };

    authServer.getExpiresDate = function () {
        return new Date(Date.now() + authServer.expiresIn * 60000);
    };
}

function authorizeRequestWithClient(authServer, client, context, userId, callback) {
    if (!client) {
        return callback(errors.invalidClient(context));
    }

    if (!context.redirect_uri || !authServer.clientService.isValidRedirectUri(client, context.redirect_uri)) {
        return callback(errors.redirectUriMismatch(context.state));
    }

    function finalResponse(error, data) {
        if(error){
            return callback(error);
        }

        callback(
            null,
            {
                redirectUri: utils.buildAuthorizationUri(context, authServer.expiresIn, data.code, data.access_token),
                state: context.state
            }
        );
    }

    if (utils.isCodeResponseType(context.response_type)) {
        authServer.tokenService.generateAuthorizationCode(function(error, code){
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAuthorizationCode({
                code: code,
                redirectUri: context.redirect_uri,
                clientId: client.id,
                expiresDate: authServer.getExpiresDate(),
                userId: userId
            }, finalResponse);

        });
        return;
    }

    if (utils.isTokenResponseType(context.response_type)) {
        authServer.tokenService.generateToken(function(error, token){
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAccessToken({
                access_token: token,
                expires_in: authServer.getExpiresDate()
            }, finalResponse);
        });
        return;
    }

    callback(errors.invalidResponseType(context.state));
}

AuthServer.prototype.authorizeRequest = function (request, userId, callback) {
    var authServer = this,
        context = utils.getOauthParameters(request);

    if (!context || !context.response_type) {
        return callback(errors.invalidRequest(context.state));
    }

    if (!utils.isAllowedResponseType(context.response_type)) {
        return callback(errors.unsupportedResponseType(context.state));
    }

    if (!authServer.isSupportedScope(context.scope)) {
        return callback(errors.invalidScope(context.state));
    }

    authServer.clientService.getById(context.client_id, function(error, client){
        if(error){
            return callback(error);
        }

        authorizeRequestWithClient(authServer, client, context, userId, callback);
    });
};

AuthServer.prototype.getDeviceCode = function (request, callback) {

    var authServer = this;
    var context = utils.getOauthParameters(request);

    function getCodeWithClient(client) {

            if (!client) {
                return callback(errors.invalidClient(context));
            }
            else if (!authServer.isSupportedScope(context.scope)) {
                return callback(errors.invalidScope(context.state));
            }

            var code = authServer.tokenService.generateDeviceCode();
            var finalResponse = function () {

                return callback({
                    code: code,
                    state: context.state
                });
            };

            authServer.authorizationService.saveAuthorizationCode({
                code: code,
                redirectUri: null,
                clientId: client.id,
                expiresDate: authServer.getExpiresDate(),
                userId: null
            }, finalResponse);
        }

    authServer.clientService.getById(context.client_id, getCodeWithClient);
};

AuthServer.prototype.getTokenData = function (context, userId, callback) {

    var authServer = this,
        tokenData = {
            token_type: 'Bearer',
            expires_in: authServer.getExpiresDate(),
            userId: userId,
            clientId: context.client_id
        };

    if (context.grant_type === grantTypes.authorizationCode) {
        utils.isValidAuthorizationCode(context, authServer.authorizationService, function (error, isValidAuthCode) {
            if(error){
                return callback(error);
            }

            if(!isValidAuthCode){
                callback(errors.invalidAuthorizationCode(context.state));
            }

            kgo
            ('token', authServer.tokenService.generateToken)
            ('refreshToken', authServer.tokenService.generateToken)
            (['token', 'refreshToken'], function(token, refreshToken){
                tokenData.access_token = token;
                tokenData.refresh_token = refreshToken;
                callback(null, tokenData);
            })
            .on('error', callback);
        });
        return;
    }

    if (context.grant_type === grantTypes.password) {
        authServer.membershipService.areUserCredentialsValid(context.username, context.password, context.scope, function (isValidPassword) {
            if(!isValidPassword){
                return callback(errors.invalidUserCredentials(context.state));
            }

            kgo
            ('token', authServer.tokenService.generateToken)
            ('refreshToken', authServer.tokenService.generateToken)
            (['token', 'refreshToken'], function(token, refreshToken){
                tokenData.access_token = token;
                tokenData.refresh_token = refreshToken;
                callback(null, tokenData);
            })
            .on('error', callback);
        });
        return;
    }

    if (context.grant_type === grantTypes.clientCredentials) {
        kgo
        ('token', authServer.tokenService.generateToken)
        (['token'], function(token){
            tokenData.access_token = token;
            callback(null, tokenData);
        })
        .on('error', callback);

        return;
    }

    if (context.grant_type === grantTypes.implicit) {
        return callback(errors.cannotRequestImplicitToken(context.state));
    }

    return callback(errors.unsupportedGrantType(context.state));
};

AuthServer.prototype.grantAccessToken = function (request, userId, callback) {

    var authServer = this;
    var context = utils.getOauthParameters(request);

    if (!context.grant_type) {
        return callback(errors.invalidRequest(context.state));
    }
    else if (!grantTypes.isAllowed(context.grant_type, authServer)) {
        return callback(errors.unsupportedGrantType(context.state));
    }

    authServer.clientService.getById(context.client_id, function (error, client) {
        if(error){
            return callback(error);
        }

        if (!client) {
            return callback(errors.invalidClient(context.state));
        }
        else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grant_type)) {
            return callback(errors.unsupportedGrantTypeForClient(context.state));
        }

        if (grantTypes.requiresClientSecret(context.grant_type) && context.client_secret !== client.secret) {
            return callback(errors.clientCredentialsInvalid(context.state));
        }

        authServer.getTokenData(context, userId, function (error, tokenData) {
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAccessToken(tokenData, function (error, token) {
                delete token.userId;
                delete token.clientId;
                callback(null, token);
            });
        });
    });
};

AuthServer.prototype.validateAccessToken = function (request, callback) {

    var context = utils.getOauthParameters(request);

    this.authorizationService.getAccessToken(context.access_token, function (error, tokenData) {
        if(error){
            return callback(error);
        }

        if (!tokenData || !tokenData.access_token) {
            return callback({
                isValid: false,
                error: 'Access token not found'
            });
        }

        if (tokenData.expiresDate < new Date()) {
            callback({
                isValid: false,
                error: 'Access token has expired'
            });
        }

        callback(
            null,
            {
                isValid: true,
                userId: tokenData.userId,
                clientId: tokenData.userId
            }
        );
    });
};


module.exports = AuthServer;