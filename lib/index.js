var errors = require('./errors'),
    grantTypes = require('./grantTypes'),
    utils = require('./util');

function AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes) {
    if(!(this instanceof AuthServer)) {
        return new AuthServer(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);
    }

    this.clientService = clientService;
    this.tokenService = tokenService;
    this.authorizationService = authorizationService;
    this.membershipService = membershipService;
    this.expiresIn = expiresIn || 3600;

    if(!supportedScopes){
        supportedScopes = [];
    }

    this.isSupportedScope = function (scopes) {
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

    this.getExpiresDate = function () {
        return new Date(Date.now() + this.expiresIn * 60000);
    };
}

AuthServer.prototype.authorizeRequest = function (request, userId, callback) {

    var self = this,
        context = utils.getOauthParameters(request);

    if (!context || !context.responseType) {
        return callback(errors.invalidRequest(context.state));
    }
    else if (!utils.isAllowedResponseType(context.responseType)) {
        return callback(errors.unsupportedResponseType(context.state));
    }

    function authorizeRequestWithClient(client) {

        if (!client) {
            return callback(errors.invalidClient(context));
        }
        else if (!context.redirectUri || !self.clientService.isValidRedirectUri(client, context.redirectUri)) {
            return callback(errors.redirectUriMismatch(context.state));
        }

        if (!self.isSupportedScope(context.scope)) {
            return callback(errors.invalidScope(context.state));
        }

        var token = utils.isTokenResponseType(context.responseType) ? self.tokenService.generateToken() : null;
        var code = utils.isCodeResponseType(context.responseType) ? self.tokenService.generateToken() : null;
        var finalResponse = function () {

            return callback({
                redirectUri: utils.buildAuthorizationUri(context.redirectUri, code, token, context.scope, context.state, self.expiresIn),
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
    }

    self.clientService.getById(context.clientId, authorizeRequestWithClient);
};

AuthServer.prototype.getDeviceCode = function (request, callback) {

    var self = this;
    var context = utils.getOauthParameters(request);

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

AuthServer.prototype.getTokenData = function (context, userId, callback) {

    var self = this;
    var grantType = context.grantType.toLowerCase();
    var generateTokenDataRef = function (includeRefreshToken) {

        return utils.generateTokenData(userId, context.clientId, includeRefreshToken, self.tokenService.generateToken, self.getExpiresDate);
    };

    if (grantType === grantTypes.authorizationCode) {
        utils.isValidAuthorizationCode(context, self.authorizationService, function (isValidAuthCode) {

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

AuthServer.prototype.grantAccessToken = function (request, userId, callback) {

    var self = this;
    var context = utils.getOauthParameters(request);

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

        if (grantTypes.requestuiresClientSecret(context.grantType) && context.clientSecret !== client.secret) {
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

AuthServer.prototype.validateAccessToken = function (request, callback) {

    var context = utils.getOauthParameters(request);

    return this.authorizationService.getAccessToken(context.access_token, function (tokenData) {

        var response;
        if (!tokenData || !tokenData.access_token) {
            response = {
                isValid: false,
                error: 'Access token not found'
            };
        }
        else if (utils.isExpired(tokenData.expiresDate)) {
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


module.exports = AuthServer;