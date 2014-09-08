var test = require('grape'),
    errors = require('../../lib/errors'),
    url = require('url'),
    testError = 'boom!!!',
    pathToObjectUnderTest = '../../lib/authorizeRequest',
    authorizeRequest = require(pathToObjectUnderTest);

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

test('authorizeRequest exists', function(t){
    t.plan(2);

    t.ok(authorizeRequest, 'authorizeRequest Exists');
    t.equal(typeof authorizeRequest, 'function', 'authorizeRequest is a function');
});

test('authorizeRequest errors with no context', function(t){
    t.plan(2);

    var context = null,
        accountId = null;

    authorizeRequest(context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.invalidRequest(context), 'got correct error and data');
    });
});

test('authorizeRequest errors with no context.response_type', function(t){
    t.plan(2);

    var context = {},
        accountId = null;

    authorizeRequest(context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.invalidRequest(context), 'got correct error and data');
    });
});

test('authorizeRequest errors with invalid context.response_type', function(t){
    t.plan(2);

    var context = {
            response_type: 'foo'
        },
        accountId = null;

    authorizeRequest(context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.unsupportedResponseType(context), 'got correct error and data');
    });
});

test('authorizeRequest continues with valid context.response_type', function(t){
    t.plan(4);

    var context = {
            response_type: 'token'
        },
        accountId = null,
        authServer = {
            isSupportedScope: function(){
                return false;
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.notDeepEqual(error, errors.unsupportedResponseType(context), 'got correct error and data');
    });

    context.response_type = 'code';

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.notDeepEqual(error, errors.unsupportedResponseType(context), 'got correct error and data');
    });
});

test('authorizeRequest errors with invalid context.scope', function(t){
    t.plan(3);

    var context = {
            response_type: 'token',
            scope: 'foo'
        },
        accountId = null,
        authServer = {
            isSupportedScope: function(scope){
                t.equal(scope, context.scope, 'got correct scope');
                return false;
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.invalidScope(context), 'got correct error and data');
    });
});

test('authorizeRequest handels getByIdErrors', function(t){
    t.plan(3);

    var context = {
            response_type: 'token',
            client_id: 123
        },
        accountId = null,
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(testError);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.equal(error, testError, 'got correct error and data');
    });
});

test('authorizeRequestWithClient requires client', function(t){
    t.plan(2);

    var context = {
            response_type: 'token',
            client_id: 123
        },
        accountId = null,
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            clientService: {
                getById: function(clientId, callback){
                    callback();
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.invalidClient(context), 'got correct error and data');
    });
});

test('authorizeRequestWithClient requires context.redirect_uri', function(t){
    t.plan(2);

    var context = {
            response_type: 'token',
            client_id: 123
        },
        accountId = null,
        testClient = {},
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.redirectUriMismatch(context), 'got correct error and data');
    });
});

test('authorizeRequestWithClient errors on redirect_uri mismatch', function(t){
    t.plan(4);

    var context = {
            response_type: 'token',
            redirect_uri: 'foo'
        },
        accountId = null,
        testClient = {},
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(client, redirectUri){
                    t.equal(client, testClient, 'got correct client');
                    t.equal(redirectUri, context.redirect_uri, 'got correct redirect_uri');
                    return false;
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'got error');
        t.deepEqual(error, errors.redirectUriMismatch(context), 'got correct error and data');
    });
});

test('authorizeRequestWithClient generate code if response_type is code', function(t){
    t.plan(6);

    var now = new Date(),
        context = {
            response_type: 'code',
            redirect_uri: 'http://foo.com/?things=stuff',
            scope: ['things', 'stuff'],
            state: 'foo'
        },
        accountId = 123,
        testClient = {
            id: 789
        },
        generatedCode = 'generated code',
        expectedCodeData = {
            code: generatedCode,
            redirectUri: context.redirect_uri,
            clientId: testClient.id,
            expiresDate: now,
            accountId: accountId
        },
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(client, redirectUri){
                    t.equal(client, testClient, 'got correct client');
                    t.equal(redirectUri, context.redirect_uri, 'got correct redirect_uri');
                    return true;
                }
            },
            tokenService: {
                generateAuthorizationCode: function(callback){
                    t.pass('generated code');
                    callback(null, generatedCode);
                }
            },
            authorizationService: {
                saveAuthorizationCode: function(codeData, callback){
                    t.deepEqual(codeData, expectedCodeData, 'created code with correct data');
                    callback(null, expectedCodeData);
                }
            }
        },
        expectedResult = {
            redirectUri: buildAuthorizationUri(context, authServer.expiresIn, expectedCodeData.code),
            state: context
        };

    authorizeRequest.call(authServer, context, accountId, function(error, result){
        t.notOk(error, 'no error');
        t.deepEqual(result, expectedResult, 'got correct result');
    });
});

test('authorizeRequestWithClient generate code handels save code error', function(t){
    t.plan(2);

    var now = new Date(),
        context = {
            response_type: 'code',
            redirect_uri: 'http://foo.com/?things=stuff'
        },
        accountId = 123,
        testClient = {
            id: 789
        },
        generatedCode = 'generated code',
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(){
                    return true;
                }
            },
            tokenService: {
                generateAuthorizationCode: function(callback){
                    callback(null, generatedCode);
                }
            },
            authorizationService: {
                saveAuthorizationCode: function(codeData, callback){
                    callback(testError);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'no error');
        t.equal(error, testError, 'got correct error');
    });
});

test('authorizeRequestWithClient generate code handels generate code error', function(t){
    t.plan(2);

    var now = new Date(),
        context = {
            response_type: 'code',
            redirect_uri: 'http://foo.com/?things=stuff'
        },
        accountId = 123,
        testClient = {
            id: 789
        },
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(){
                    return true;
                }
            },
            tokenService: {
                generateAuthorizationCode: function(callback){
                    callback(testError);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'no error');
        t.equal(error, testError, 'got correct error');
    });
});

test('authorizeRequestWithClient generate code handels get client error', function(t){
    t.plan(2);

    var now = new Date(),
        context = {
            response_type: 'code',
            redirect_uri: 'http://foo.com/?things=stuff'
        },
        accountId = 123,
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(testError);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'no error');
        t.equal(error, testError, 'got correct error');
    });
});

test('authorizeRequestWithClient generate token if response_type is token', function(t){
    t.plan(6);

    var now = new Date(),
        context = {
            response_type: 'token',
            redirect_uri: 'http://foo.com/?things=stuff',
            scope: ['things', 'stuff'],
            state: 'foo'
        },
        accountId = 123,
        testClient = {
            id: 789
        },
        generatedToken = 'generated token',
        expectedTokenData = {
            clientId: testClient.id,
            access_token: generatedToken,
            expires_in: now,
            accountId: accountId,
            token_type: 'Bearer'
        },
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(client, redirectUri){
                    t.equal(client, testClient, 'got correct client');
                    t.equal(redirectUri, context.redirect_uri, 'got correct redirect_uri');
                    return true;
                }
            },
            tokenService: {
                generateToken: function(callback){
                    t.pass('generated token');
                    callback(null, generatedToken);
                }
            },
            authorizationService: {
                saveAccessToken: function(tokenData, callback){
                    t.deepEqual(tokenData, expectedTokenData, 'created token with correct data');
                    callback(null, expectedTokenData);
                }
            }
        },
        expectedResult = {
            redirectUri: buildAuthorizationUri(context, authServer.expiresIn, undefined, expectedTokenData.access_token),
            state: context
        };

    authorizeRequest.call(authServer, context, accountId, function(error, result){
        t.notOk(error, 'no error');
        t.deepEqual(result, expectedResult, 'got correct result');
    });
});

test('authorizeRequestWithClient generate token handels save token error', function(t){
    t.plan(2);

    var now = new Date(),
        context = {
            response_type: 'token',
            redirect_uri: 'http://foo.com/?things=stuff'
        },
        accountId = 123,
        testClient = {
            id: 789
        },
        generatedToken = 'generated token',
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(){
                    return true;
                }
            },
            tokenService: {
                generateToken: function(callback){
                    callback(null, generatedToken);
                }
            },
            authorizationService: {
                saveAccessToken: function(tokenData, callback){
                    callback(testError);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'no error');
        t.equal(error, testError, 'got correct error');
    });
});

test('authorizeRequestWithClient generate token handels generate token error', function(t){
    t.plan(2);

    var now = new Date(),
        context = {
            response_type: 'token',
            redirect_uri: 'http://foo.com/?things=stuff'
        },
        accountId = 123,
        testClient = {
            id: 789
        },
        authServer = {
            isSupportedScope: function(){
                return true;
            },
            getExpiresDate: function(){
                return now;
            },
            expiresIn: 1234,
            clientService: {
                getById: function(clientId, callback){
                    callback(null, testClient);
                },
                isValidRedirectUri: function(){
                    return true;
                }
            },
            tokenService: {
                generateToken: function(callback){
                    callback(testError);
                }
            }
        };

    authorizeRequest.call(authServer, context, accountId, function(error){
        t.ok(error, 'no error');
        t.equal(error, testError, 'got correct error');
    });
});
