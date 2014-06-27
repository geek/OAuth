var url = require('url');

function getBearerToken(request) {
    if (request && request.headers && request.headers.authorization &&
        request.headers.authorization.toLowerCase().indexOf('bearer ') === 0) {
        return request.headers.authorization.split(' ').pop();
    }
}

function getOauthParameters(request) {
    var query = url.parse(request.url, true).query;

    query.responseType = query.response_type;
    query.clientId = query.client_id;
    query.clientSecret = query.client_secret;
    query.grantType = query.grant_type;
    query.redirectUri = query.redirect_uri;
    query.userName = query.username;

    query.scope = query.scope ? query.scope.split(',') : null;
    query.accessToken = query.access_token || getBearerToken(request);

    return query;
}

function isValidAuthorizationCode(context, authorizationService, callback) {
    /*
        Validate the code is present, matches the stored one, and the clientId's match across requests
    */
    authorizationService.getAuthorizationCode(context.code, function (authorizationCode) {
        callback(authorizationCode &&
            context.code === authorizationCode.code &&
            authorizationCode.expiresDate > new Date() &&
            context.clientId === authorizationCode.clientId);
    });
}

function generateTokenData(userId, clientId, includeRefreshToken, generateToken, getExpiresDate) {
    var tokenData = {
        access_token: generateToken(),
        token_type: 'bearer',
        expires_in: getExpiresDate(),
        userId: userId,
        clientId: clientId,
        refresh_token: includeRefreshToken ? generateToken() : null
    };

    return tokenData;
}

function doesArrayContain(arrayList, item) {
    if (!arrayList) {
        return false;
    }

    for (var i = 0, length = arrayList.length; i < length; i++) {
        if (arrayList[i] === item) {
            return true;
        }
    }

    return false;
}

function isCodeResponseType(responseType) {
    return responseType === 'code' || responseType === 'code_and_token';
}

function isTokenResponseType(responseType) {
    return responseType === 'token' || responseType === 'code_and_token';
}

function isAllowedResponseType(responseType) {
    return isCodeResponseType(responseType) || isTokenResponseType(responseType);
}

function buildAuthorizationUri(redirectUri, code, token, scope, state, expiresIn) {
    var query = '';

    if (code) {
        query += 'code=' + code;
    }
    if (token) {
        query += '&access_token=' + token;
    }
    if (expiresIn) {
        query += '&expires_in=' + expiresIn;
    }

    if (scope) {
        var scopeFormatted = '&scope=';
        for (var i = 0, len = scope.length; i < len; i++) {
            scopeFormatted += scope[i] + ',';
        }

        if (scopeFormatted[scopeFormatted.length] === ',') {
            scopeFormatted = scopeFormatted.slice(0, scopeFormatted.length - 1);
        }

        query += scopeFormatted;
    }

    if (state) {
        query += '&state=' + state;
    }

    return redirectUri + '?' + query;
}

function areClientCredentialsValid(client, context) {
    return client.id === context.clientId && client.secret === context.clientSecret;
}

module.exports = {
    isValidAuthorizationCode: isValidAuthorizationCode,
    generateTokenData: generateTokenData,
    doesArrayContain: doesArrayContain,
    isAllowedResponseType: isAllowedResponseType,
    isCodeResponseType: isCodeResponseType,
    isTokenResponseType: isTokenResponseType,
    buildAuthorizationUri: buildAuthorizationUri,
    areClientCredentialsValid: areClientCredentialsValid,
    getOauthParameters: getOauthParameters
};