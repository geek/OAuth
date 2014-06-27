var uuid = require('node-uuid'),
    authCodes = {},
    accessTokens = {},
    clients = {
        '1': {
            id: '1',
            secret: 'kittens',
            grantTypes: ['implicit', 'password', 'client_credentials', 'authorization_code']
        }
    };

module.exports = {
    clientService: {
        getById: function(id, callback) {
            return callback(clients[id]);
        },
        isValidRedirectUri: function(/*client, uri*/) {
            return true;
        }
    },
    tokenService: {
        generateToken: function() {
            return uuid.v4();
        },
        generateDeviceCode: function() {
            return uuid.v4();
        }
    },
    authorizationService: {
        saveAuthorizationCode: function(codeData, callback) {
            authCodes[codeData.code] = codeData;
            return callback();
        },
        saveAccessToken: function(tokenData, callback) {
            accessTokens[tokenData.access_token] = tokenData;
            return callback();
        },
        getAuthorizationCode: function(code, callback) {
            return callback(authCodes[code]);
        },
        getAccessToken: function(token, callback) {
            return callback(accessTokens[token]);
        }
    },
    membershipService: {
        areUserCredentialsValid: function(userName, password, scope, callback) {
            return callback(true);
        }
    }
};