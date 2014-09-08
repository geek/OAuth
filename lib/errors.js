function invalidRequest(state) {
    return {
        error: 'invalid_request',
        error_description: 'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.',
        state: state
    };
}

function unauthorizedClient(state) {
    return {
        error: 'unauthorized_client',
        error_description: 'The client is not authorized to request an authorization code using this method.',
        state: state
    };
}

function accessDenied(state) {
    return {
        error: 'access_denied',
        error_description: 'The resource owner or authorization server denied the request.',
        state: state
    };
}

function unsupportedResponseType(state) {
    return {
        error: 'unsupported_response_type',
        error_description: 'The authorization server does not support obtaining an authorization code using this method.',
        state: state
    };
}

function redirectUriMismatch(state) {
    return {
        error: 'invalid_request',
        error_description: 'The redirect URI doesn\'t match what is stored for this client',
        state: state
    };
}

function invalidScope(state) {
    return {
        error: 'invalid_scope',
        error_description: 'The requested scope is invalid, unknown, or malformed.',
        state: state
    };
}

function invalidResponseType(state) {
    return {
        error: 'unsupported_response_type',
        error_description: 'The authorization server does not support this response type.',
        state: state
    };
}

function clientCredentialsInvalid(state) {
    return {
        error: 'unauthorized_client',
        error_description: 'The client credentials are invalid.',
        state: state
    };
}

function userCredentialsInvalid(state) {
    return {
        error: 'access_denied',
        error_description: 'The user credentials are invalid.',
        state: state
    };
}

function unsupportedGrantType(state) {
    return {
        error: 'unsupported_grant_type',
        error_description: 'The authorization grant type is not supported by the authorization server.',
        state: state
    };
}

function unsupportedGrantTypeForClient(state) {
    return {
        error: 'unauthorized_client',
        error_description: 'The grant type is not supported for this client.',
        state: state
    };
}

function invalidAuthorizationCode(state) {
    return {
        error: 'invalid_grant',
        error_description: 'The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.',
        state: state
    };
}

function invalidClient(state) {
    return {
        error: 'invalid_client',
        error_description: 'Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).',
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
    invalidClient: invalidClient
};