// Load modules

var contextHandler = require('./context'),
    errors = require('./errors'),
    grantTypes = require('./grantTypes'),
    authUtil = require('./util');


// Declare internals

var internals = {};



module.exports = internals.AuthServer = function (clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {

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
    var context = contextHandler(req);

    if (!context || !context.responseType) {
        return callback(errors.invalidRequest(context.state));
    }
    else if (!authUtil.isAllowedResponseType(context.responseType)) {
        return callback(errors.unsupportedResponseType(context.state));
    }

    var authorizeRequestWithClient = function (client) {

        if (!client) {
            return callback(errors.invalidClient(context));
        }
        else if (!context.redirectUri || !self.clientService.isValidRedirectUri(client, context.redirectUri)) {
            return callback(errors.redirectUriMismatch(context.state));
        }

        if (!self.isSupportedScope(context.scope)) {
            return callback(errors.invalidScope(context.state));
        }

        var token = authUtil.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null;
        var code = authUtil.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;
        var finalResponse = function () {

            return callback({
                redirectUri: authUtil.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn),
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
    var context = contextHandler(req);

    var getCodeWithClient = function (client) {

            if (!client) {
                return callback(errors.invalidClient(context));
            }
            else if (!self.isSupportedScope(context.scope)) {
                return callback(errors.invalidScope(context.state));
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

        return authUtil.generateTokenData(userId, context.clientId, includeRefreshToken, self.tokenService.generateToken, self.getExpiresDate);
    };

    if (grantType === grantTypes.authorizationCode) {
        authUtil.isValidAuthorizationCode(context, self.authorizationService, function (isValidAuthCode) {

            var tokenData = isValidAuthCode ? generateTokenDataRef(true) : errors.invalidAuthorizationCode(context.state);
            return callback(tokenData);
        });
    }
    else if (grantType === grantTypes.password) {
        self.membershipService.areUserCredentialsValid(context.userName, context.password, context.scope, function (isValidPassword) {

            var tokenData = isValidPassword ? generateTokenDataRef(true) : errors.invalidUserCredentials(context.state);
            return callback(tokenData);
        });
    }
    else if (grantType === grantTypes.clientCredentials) {
        return callback(generateTokenDataRef(false));
    }
    else if (grantType === grantTypes.implicit) {
        return callback(errors.cannotRequestImplicitToken(context.state));
    }

    return callback(errors.unsupportedGrantType(context.state));
};

internals.AuthServer.prototype.grantAccessToken = function (req, userId, callback) {

    var self = this;
    var context = contextHandler(req);

    if (!context.grantType) {
        return callback(errors.invalidRequest(context.state));
    }
    else if (!grantTypes.isAllowed(context.grantType, self)) {
        return callback(errors.unsupportedGrantType(context.state));
    }

    var next = function (client) {

        if (!client) {
            return callback(errors.invalidClient(context));
        }
        else if (!grantTypes.isAllowedForClient(client.grantTypes, context.grantType)) {
            return callback(errors.unsupportedGrantTypeForClient(context.state));
        }

        if (grantTypes.requiresClientSecret(context.grantType) && context.clientSecret !== client.secret) {
            return callback(errors.clientCredentialsInvalid(context.state));
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

    var self = this;
    var context = contextHandler(req);

    return self.authorizationService.getAccessToken(context.access_token, function (tokenData) {

        var response;
        if (!tokenData || !tokenData.access_token) {
            response = {
                isValid: false,
                error: 'Access token not found'
            };
        }
        else if (authUtil.isExpired(tokenData.expiresDate)) {
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