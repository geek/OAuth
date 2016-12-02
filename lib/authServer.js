// Load modules

var Assert = require('assert');
var ContextHandler = require('./context');
var Errors = require('./errors');
var GrantTypes = require('./grantTypes');
var AuthUtil = require('./util');


// Declare internals

var internals = {};


module.exports = internals.AuthServer = function (clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {

    Assert(this.constructor === internals.AuthServer, 'AuthServer must be constructed with new');

    this.clientService = clientService;
    this.tokenService = tokenService;
    this.authorizationService = authorizationService;
    this.membershipService = membershipService;
    this.expiresIn = expiresIn || 3600;

    this.isSupportedScope = function (scope) {

        return !supportedScopes || scope ;
    };

    this.getExpiresDate = function () {

        return new Date(new Date().getTime() + expiresIn * 60000);
    };
};

internals.AuthServer.prototype.authorizeRequest = function (req, userId, callback) {

    var self = this;
    var context = ContextHandler(req);

    if (!context || !context.responseType) {
        return callback(Errors.invalidRequest(context.state));
    }
    else if (!AuthUtil.isAllowedResponseType(context.responseType)) {
        return callback(Errors.unsupportedResponseType(context.state));
    }

    var authorizeRequestWithClient = function (client) {

            if (!client) {
                return callback(Errors.invalidClient(context));
            }
            else if (!context.redirectUri || !self.clientService.isValidRedirectUri(client, context.redirectUri)) {
                return callback(Errors.redirectUriMismatch(context.state));
            }

            if (!self.isSupportedScope(context.scope)) {
                return callback(Errors.invalidScope(context.state));
            }

            var token = AuthUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null;
            var code = AuthUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;
            var finalResponse = function () {

                return callback({
                    redirectUri: AuthUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn),
                    state: context.state
                });
            };

            if (code) {
                self.authorizationService.saveAuthorizationCode({
                    code: code,
                    redirectUri: context.redirectUri,
                    clientId: client.id,
                    timestamp: new Date(),
                    userId: userId
                }, finalResponse);
            }
            else if (token) {
                self.authorizationService.saveAccessToken({
                    access_token: token,
                    expires_in: self.getExpiresDate()
                }, finalResponse);
            }
        },
        next = function (client) {

            authorizeRequestWithClient(client);
        };

    self.clientService.getById(context.clientId, next);
};

internals.AuthServer.prototype.getDeviceCode = function (req, callback) {

    var self = this;
    var context = ContextHandler(req);

    var getCodeWithClient = function (client) {

            if (!client) {
                return callback(Errors.invalidClient(context));
            }
            else if (!self.isSupportedScope(context.scope)) {
                return callback(Errors.invalidScope(context.state));
            }

            var code = self.tokenService.generateDeviceCode();
            var finalResponse = function () {

                return callback({
                    code: code,
                    state: context.state
                });
            };

            self.authorizationService.saveAuthorizationCode({
                code: code,
                redirectUri: null,
                clientId: client.id,
                timestamp: new Date(),
                userId: null
            }, finalResponse);
        },
        next = function (client) {

            getCodeWithClient(client);
        };

    self.clientService.getById(context.clientId, next);
};

internals.AuthServer.prototype.getTokenData = function (context, userId, callback) {

    var self = this;
    var grantType = context.grantType.toLowerCase();
    var generateTokenDataRef = function (includeRefreshToken) {

        return AuthUtil.generateTokenData(userId, context.clientId, includeRefreshToken, self.tokenService.generateToken, self.getExpiresDate);
    };

    if (grantType === GrantTypes.authorizationCode) {
        AuthUtil.isValidAuthorizationCode(context, self.authorizationService, function (isValidAuthCode) {

            var tokenData = isValidAuthCode ? generateTokenDataRef(true) : Errors.invalidAuthorizationCode(context.state);
            return callback(tokenData);
        });
    }
    else if (grantType === GrantTypes.password) {
        return self.membershipService.areUserCredentialsValid(context.userName, context.password, context.scope, function (isValidPassword) {

            var tokenData = isValidPassword ? generateTokenDataRef(true) : Errors.invalidUserCredentials(context.state);
            return callback(tokenData);
        });
    }
    else if (grantType === GrantTypes.clientCredentials) {
        return callback(generateTokenDataRef(false));
    }
    else if (grantType === GrantTypes.implicit) {
        return callback(Errors.cannotRequestImplicitToken(context.state));
    }

    return callback(Errors.unsupportedGrantType(context.state));
};

internals.AuthServer.prototype.grantAccessToken = function (req, userId, callback) {

    var self = this;
    var context = ContextHandler(req);

    if (!context.grantType) {
        return callback(Errors.invalidRequest(context.state));
    }
    else if (!GrantTypes.isAllowed(context.grantType, self)) {
        return callback(Errors.unsupportedGrantType(context.state));
    }

    var next = function (client) {

        if (!client) {
            return callback(Errors.invalidClient(context));
        }
        else if (!GrantTypes.isAllowedForClient(client.grantTypes, context.grantType)) {
            return callback(Errors.unsupportedGrantTypeForClient(context.state));
        }

        if (GrantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret) {
            return callback(Errors.clientCredentialsInvalid(context.state));
        }

        return self.getTokenData(context, userId, function (tokenData) {

            return tokenData.error ? callback(tokenData) : self.authorizationService.saveAccessToken(tokenData, function () {

                delete tokenData.userId;
                delete tokenData.clientId;
                callback(tokenData);
            });
        });
    };

    self.clientService.getById(context.clientId, next);
};

internals.AuthServer.prototype.validateAccessToken = function (req, callback) {

    var context = ContextHandler(req);

    return this.authorizationService.getAccessToken(context.access_token, function (tokenData) {

        var response;
        if (!tokenData || !tokenData.access_token) {
            response = {
                isValid: false,
                error: 'Access token not found'
            };
        }
        else if (AuthUtil.isExpired(tokenData.expiresDate)) {
            response = {
                isValid: false,
                error: 'Access token has expired'
            };
        }
        else {
            response = {
                isValid: true,
                userId: tokenData.userId,
                clientId: tokenData.userId
            };
        }

        return callback(response);
    });
};