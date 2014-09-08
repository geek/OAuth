var test = require('grape'),
    errors = require('../../lib/errors'),
    grantTypes = require('../../lib/grantTypes'),
    testError = 'boom!!!',
    pathToObjectUnderTest = '../../lib/getTokenData';

test('getTokenData exists', function(t){
    t.plan(2);

    var getTokenData = require(pathToObjectUnderTest);

    t.ok(getTokenData, 'getTokenData Exists');
    t.equal(typeof getTokenData, 'function', 'getTokenData is a function');
});

test('getTokenData errors with invalid grantType', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        authServer = {
            getExpiresDate: function(){}
        },
        context = {},
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, errors.unsupportedGrantType(context), 'correct error and data');
    });
});

test('getTokenData gets token with grant type AUTHORIZATIONCODE', function(t){
    t.plan(3);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        testToken = '1234567890',
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authorizationCode = {
            code: context.code,
            clientId: context.client_id,
            accountId: 789,
            expiresDate: new Date(now.getTime() + 9999999)
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    t.equal(code, context.code, 'correct code');
                    callback(null, authorizationCode);
                }
            },
            tokenService: {
                generateToken: function(callback){
                    callback(null, testToken);
                }
            }
        },
        expectedTokenData = {
            token_type: 'Bearer',
            expires_in: authServer.getExpiresDate(),
            clientId: context.client_id,
            accountId: authorizationCode.accountId,
            access_token: testToken,
            refresh_token: testToken
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error, tokenData){
        t.notOk(error, 'no error');
        t.deepEqual(tokenData, expectedTokenData, 'correct tokenData');
    });
});

test('getTokenData handels generate token error with grant type AUTHORIZATIONCODE', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        doneOnce,
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authorizationCode = {
            code: context.code,
            clientId: context.client_id,
            accountId: 789,
            expiresDate: new Date(now.getTime() + 9999999)
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    callback(null, authorizationCode);
                }
            },
            tokenService: {
                generateToken: function(callback){
                    if(!doneOnce){
                        doneOnce = true;
                        callback(testError);
                    }
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.equal(error, testError, 'correct error');
    });
});

test('getTokenData isValidAuthorizationCode handels different client ids', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authorizationCode = {
            code: context.code,
            clientId: context.client_id + 'foo',
            accountId: 789,
            expiresDate: new Date(now.getTime() + 9999999)
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    callback(null, authorizationCode);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, errors.invalidAuthorizationCode(context), 'correct error and data');
    });
});

test('getTokenData isValidAuthorizationCode handels expired date', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authorizationCode = {
            code: context.code,
            clientId: context.client_id,
            accountId: 789,
            expiresDate: now
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    callback(null, authorizationCode);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, errors.invalidAuthorizationCode(context), 'correct error and data');
    });
});

test('getTokenData isValidAuthorizationCode handels differnet codes', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authorizationCode = {
            code: context.code + 'foo',
            clientId: context.client_id,
            accountId: 789,
            expiresDate: now
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    callback(null, authorizationCode);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, errors.invalidAuthorizationCode(context), 'correct error and data');
    });
});

test('getTokenData isValidAuthorizationCode handels missing authorization', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authorizationCode = null,
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    callback(null, authorizationCode);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, errors.invalidAuthorizationCode(context), 'correct error and data');
    });
});

test('getTokenData handels getAuthorizationCode error', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            code: 123,
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            authorizationService: {
                getAuthorizationCode: function(code, callback){
                    callback(testError);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, testError, 'correct error');
    });
});

test('getTokenData gets token with grant type PASSWORD', function(t){
    t.plan(5);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        testToken = '1234567890',
        context = {
            grant_type: grantTypes.PASSWORD,
            username: 'foo',
            password: 'bar',
            scope: 'meh',
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            membershipService: {
                areUserCredentialsValid: function(username, password, scope, callback){
                    t.equal(username, context.username, 'correct username');
                    t.equal(password, context.password, 'correct password');
                    t.equal(scope, context.scope, 'correct scope');
                    callback(null, true);
                }
            },
            tokenService: {
                generateToken: function(callback){
                    callback(null, testToken);
                }
            }
        },
        expectedTokenData = {
            token_type: 'Bearer',
            expires_in: authServer.getExpiresDate(),
            clientId: context.client_id,
            access_token: testToken,
            refresh_token: testToken
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error, tokenData){
        t.notOk(error, 'no error');
        t.deepEqual(tokenData, expectedTokenData, 'correct tokenData');
    });
});

test('getTokenData with grant type PASSWORD handels generate token error', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        doneOnce,
        context = {
            grant_type: grantTypes.PASSWORD,
            username: 'foo',
            password: 'bar',
            scope: 'meh',
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            membershipService: {
                areUserCredentialsValid: function(username, password, scope, callback){
                    callback(null, true);
                }
            },
            tokenService: {
                generateToken: function(callback){
                    if(!doneOnce){
                        doneOnce = true;
                        callback(testError);
                    }
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.equal(error, testError, 'correct error');
    });
});

test('getTokenData with grant type PASSWORD handels invalid credentials', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.PASSWORD,
            username: 'foo',
            password: 'bar',
            scope: 'meh',
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            membershipService: {
                areUserCredentialsValid: function(username, password, scope, callback){
                    callback(null, false);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, errors.userCredentialsInvalid(context), 'correct error and data');
    });
});

test('getTokenData with grant type PASSWORD handels credential error', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.PASSWORD,
            username: 'foo',
            password: 'bar',
            scope: 'meh',
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            membershipService: {
                areUserCredentialsValid: function(username, password, scope, callback){
                    callback(testError);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.deepEqual(error, testError, 'correct error');
    });
});

test('getTokenData gets token with grant type CLIENTCREDENTIALS', function(t){
    t.plan(2);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        testToken = '1234567890',
        context = {
            grant_type: grantTypes.CLIENTCREDENTIALS,
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            tokenService: {
                generateToken: function(callback){
                    callback(null, testToken);
                }
            }
        },
        expectedTokenData = {
            token_type: 'Bearer',
            expires_in: authServer.getExpiresDate(),
            clientId: context.client_id,
            access_token: testToken
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error, tokenData){
        t.notOk(error, 'no error');
        t.deepEqual(tokenData, expectedTokenData, 'correct tokenData');
    });
});

test('getTokenData with grant type CLIENTCREDENTIALS handels generate token error', function(t){
    t.plan(1);

    var getTokenData = require(pathToObjectUnderTest),
        now = new Date(),
        context = {
            grant_type: grantTypes.CLIENTCREDENTIALS,
            client_id: 456
        },
        authServer = {
            getExpiresDate: function(){
                return now;
            },
            tokenService: {
                generateToken: function(callback){
                    callback(testError);
                }
            }
        },
        boundFunction = getTokenData.bind(authServer);

    boundFunction(context, function(error){
        t.equal(error, testError, 'correct error');
    });
});