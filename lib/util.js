var url = require('url');

function getBearerToken(request) {
    if (request && request.headers && request.headers.authorization &&
        request.headers.authorization.toLowerCase().indexOf('bearer ') === 0) {
        return request.headers.authorization.split(' ').pop();
    }
}

function getOauthParameters(request) {
    var query = url.parse(request.url, true).query;

    if(query.scope){
        query.scope = query.scope.split(',');
    }

    if(!query.access_token){
        query.access_token = getBearerToken(request);
    }

    return query;
}

function isValidAuthorizationCode(context, authorizationService, callback) {
    /*
        Validate the code is present, matches the stored one, and the clientId's match across requests
    */
    authorizationService.getAuthorizationCode(context.code, function (error, authorizationCode) {
        callback(error, authorizationCode &&
            context.code === authorizationCode.code &&
            authorizationCode.expiresDate > new Date() &&
            context.client_id === authorizationCode.clientId);
    });
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
    return responseType === 'code';
}

function isTokenResponseType(responseType) {
    return responseType === 'token';
}

function isAllowedResponseType(responseType) {
    return isCodeResponseType(responseType) || isTokenResponseType(responseType);
}

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

function areClientCredentialsValid(client, context) {
    return client.id === context.client_id && client.secret === context.client_secret;
}

module.exports = {
    isValidAuthorizationCode: isValidAuthorizationCode,
    doesArrayContain: doesArrayContain,
    isAllowedResponseType: isAllowedResponseType,
    isCodeResponseType: isCodeResponseType,
    isTokenResponseType: isTokenResponseType,
    buildAuthorizationUri: buildAuthorizationUri,
    areClientCredentialsValid: areClientCredentialsValid,
    getOauthParameters: getOauthParameters
};