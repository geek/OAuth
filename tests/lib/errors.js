var test = require('grape'),
    pathToObjectUnderTest = '../../lib/errors',
    errors = require(pathToObjectUnderTest),
    testState = { foo: 'bar'},
    excpectedErrorData = {
        invalidRequest: {error:'invalid_request', error_description: 'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.'},
        unauthorizedClient: {error:'unauthorized_client', error_description: 'The client is not authorized to request an authorization code using this method.'},
        accessDenied: {error:'access_denied', error_description: 'The resource owner or authorization server denied the request.'},
        unsupportedResponseType: {error:'unsupported_response_type', error_description: 'The authorization server does not support obtaining an authorization code using this method.'},
        redirectUriMismatch: {error:'invalid_request', error_description: 'The redirect URI doesn\'t match what is stored for this client'},
        invalidScope: {error:'invalid_scope', error_description: 'The requested scope is invalid, unknown, or malformed.'},
        invalidResponseType: {error:'unsupported_response_type', error_description: 'The authorization server does not support this response type.'},
        clientCredentialsInvalid: {error:'unauthorized_client', error_description: 'The client credentials are invalid.'},
        userCredentialsInvalid: {error:'access_denied', error_description: 'The user credentials are invalid.'},
        unsupportedGrantType: {error:'unsupported_grant_type', error_description: 'The authorization grant type is not supported by the authorization server.'},
        unsupportedGrantTypeForClient: {error:'unauthorized_client', error_description: 'The grant type is not supported for this client.'},
        invalidAuthorizationCode: {error:'invalid_grant', error_description: 'The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.'},
        invalidClient: {error:'invalid_client', error_description: 'Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).'}
    };

function testErrorMethod(expecedError, method){
    test('errors.' + method + ' exists and returns correct details', function(t){
        t.plan(4);

        t.equal(typeof errors[method], 'function', 'errors.' + method + ' is a function');

        var result = errors[method](testState);

        t.equal(result.state, testState, 'set correct state');
        t.equal(result.error, expecedError.error, 'set correct error code');
        t.equal(result.error_description, expecedError.error_description, 'set correct error_description');
    });
}

test('errors exists', function(t){
    t.plan(1);
    t.equal(typeof errors, 'object', 'errors is an object');
});

test('errors methods exists and returns correct details', function(t){

    for(var key in excpectedErrorData){
        testErrorMethod(excpectedErrorData[key], key);
    }

    t.plan(1);

    t.deepEqual(Object.keys(errors), Object.keys(excpectedErrorData), 'all errors accounted for');
});



