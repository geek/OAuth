var errors = require('./errors'),
    grantTypes = require('./grantTypes'),
    kgo = require('kgo');

function isValidAuthorizationCode(authorizationCode, context) {
     return authorizationCode &&
            context.code === authorizationCode.code &&
            authorizationCode.expiresDate > new Date() &&
            '' + context.client_id === '' + authorizationCode.clientId;
}

function getTokenData(context, callback) {
    var authServer = this,
        tokenData = {
            token_type: 'Bearer',
            expires_in: authServer.getExpiresDate(),
            clientId: context.client_id
        };

    if (context.grant_type === grantTypes.AUTHORIZATIONCODE) {
        authServer.authorizationService.getAuthorizationCode(context.code, function(error, authorizationCode){
            if(error){
                return callback(error);
            }

            if(!isValidAuthorizationCode(authorizationCode, context)){
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

    if (context.grant_type === grantTypes.PASSWORD) {
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

    if (context.grant_type === grantTypes.CLIENTCREDENTIALS) {
        kgo
        ('token', authServer.tokenService.generateToken)
        (['token'], function(token){
            tokenData.access_token = token;
            callback(null, tokenData);
        })
        .on('error', callback);

        return;
    }

    return callback(errors.unsupportedGrantType(context.state));
}

module.exports = getTokenData;