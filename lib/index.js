var errors = require('./errors'),
    grantTypes = require('./grantTypes'),
    kgo = require('kgo'),
    utils = require('./util');

function authorizeRequestWithClient(authServer, client, context, accountId, callback) {
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
                accountId: accountId
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

function authorizeRequest(context, accountId, callback) {
    var authServer = this;

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

        authorizeRequestWithClient(authServer, client, context, accountId, callback);
    });
}

function getDeviceCode(context, callback) {
    var authServer = this;

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
                accountId: null
            }, finalResponse);
        }

    authServer.clientService.getById(context.client_id, getCodeWithClient);
}

function getTokenData(context, callback) {

    var authServer = this,
        tokenData = {
            token_type: 'Bearer',
            expires_in: authServer.getExpiresDate(),
            clientId: context.client_id
        };

    if (context.grant_type === grantTypes.authorizationCode) {
        authServer.authorizationService.getAuthorizationCode(context.code, function(error, authorizationCode){
            if(error){
                return callback(error);
            }

            if(!utils.isValidAuthorizationCode(authorizationCode, context)){
                return callback(errors.invalidAuthorizationCode(context.state));
            }

            tokenData.accountId = authorizationCode.accountId;
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
}

function grantAccessToken(context, callback) {
    var authServer = this;

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

        getTokenData.call(authServer, context, function (error, tokenData) {
            if(error){
                return callback(error);
            }

            authServer.authorizationService.saveAccessToken(tokenData, function (error, token) {
                delete token.accountId;
                delete token.clientId;
                callback(null, token);
            });
        });
    });
}

function validateAccessToken(context, callback) {

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

        if (context.client_id !== tokenData.clientId) {
            callback({
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
                accountId: tokenData.accountId,
                clientId: tokenData.accountId
            }
        );
    });
}

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

AuthServer.prototype.authorizeRequest = utils.getOauthParameters(authorizeRequest);
AuthServer.prototype.getDeviceCode = utils.getOauthParameters(getDeviceCode);
AuthServer.prototype.getTokenData = utils.getOauthParameters(getTokenData);
AuthServer.prototype.grantAccessToken = utils.getOauthParameters(grantAccessToken);
AuthServer.prototype.validateAccessToken = utils.getOauthParameters(validateAccessToken);

module.exports = AuthServer;