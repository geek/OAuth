var lib = require('./lib');

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
    authServer.supportedScopes = supportedScopes ? supportedScopes : [];
}

AuthServer.prototype.getExpiresDate = function () {
    return new Date(Date.now() + this.expiresIn * 60000);
};

AuthServer.prototype.isSupportedScope = function (scopes) {
    if(!Array.isArray(scopes)){
        scopes = [scopes];
    }

    for(var i = 0; i < scopes.length; i++){
        if(!~this.supportedScopes.indexOf(scopes[i])){
            return false;
        }
    }
    return true;
};

AuthServer.prototype.authorizeRequest = lib.authorizeRequest;
AuthServer.prototype.getTokenData = lib.getTokenData;
AuthServer.prototype.grantAccessToken = lib.grantAccessToken;
AuthServer.prototype.validateAccessToken = lib.validateAccessToken;

module.exports = AuthServer;