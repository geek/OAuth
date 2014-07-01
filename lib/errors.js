function invalidRequest(state) {
    return {
        error: 'The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed.',
        state: state
    };
}

function unauthorizedClient(state) {
    return {
        error: 'The client is not authorized to request an authorization code using this method.',
        state: state
    };
}

function accessDenied(state) {
    return {
        error: 'The resource owner or authorization server denied the request.',
        state: state
    };
}

function unsupportedResponseType(state) {
    return {
        error: 'The authorization server does not support obtaining an authorization code using this method.',
        state: state
    };
}

function redirectUriMismatch(state) {
    return {
        error: 'The redirect URI doesn\'t match what is stored for this client',
        state: state
    };
}

function invalidScope(state) {
    return {
        error: 'The scope is not valid for this client',
        state: state
    };
}

function invalidResponseType(state) {
    return {
        error: 'The response type is not supported',
        state: state
    };
}

function clientCredentialsInvalid(state) {
    return {
        error: 'The client credentials are invalid',
        state: state
    };
}

function userCredentialsInvalid(state) {
    return {
        error: 'The user credentials are invalid',
        state: state
    };
}

function unsupportedGrantType(state) {
    return {
        error: 'The grant type is invalid',
        state: state
    };
}

function unsupportedGrantTypeForClient(state) {
    return {
        error: 'The grant type is not supported for this client',
        state: state
    };
}

function invalidAuthorizationCode(state) {
    return {
        error: 'The authorization code is invalid or expired',
        state: state
    };
}

function invalidClient(state) {
    return {
        error: 'The client id is invalid or expired',
        state: state
    };
}

function cannotRequestImplicitToken(state) {
    return {
        error: 'You cannot request a token from this endpoint using the implicit grant type',
        state: state
    };
}

module.exports = {
    invalidRequest: invalidRequest,
    unauthorizedClient: unauthorizedClient,
    accessDenied: accessDenied,
    unsupportedResponseType: unsupportedResponseType,
    redirectUriMismatch: redirectUriMismatch,
    invalidScope: invalidScope,
    invalidResponseType: invalidResponseType,
    clientCredentialsInvalid: clientCredentialsInvalid,
    userCredentialsInvalid: userCredentialsInvalid,
    unsupportedGrantType: unsupportedGrantType,
    unsupportedGrantTypeForClient: unsupportedGrantTypeForClient,
    invalidAuthorizationCode: invalidAuthorizationCode,
    invalidClient: invalidClient,
    cannotRequestImplicitToken: cannotRequestImplicitToken
};