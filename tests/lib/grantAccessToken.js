var test = require('grape'),
    errors = require('../../lib/errors'),
    grantTypes = require('../../lib/grantTypes'),
    kgo = require('kgo'),
    testError = 'boom!!!',
    mockery = require('mockery'),
    pathToObjectUnderTest = '../../lib/grantAccessToken';

mockery.registerAllowables([pathToObjectUnderTest, './errors', './grantTypes']);

function resetMocks(){
    mockery.registerMock('kgo', kgo);
    mockery.registerMock('./getTokenData', {});
}

function getCleanTestObject(){
    delete require.cache[require.resolve(pathToObjectUnderTest)];
    mockery.enable({ useCleanCache: true, warnOnReplace: false });
    var objectUnderTest = require(pathToObjectUnderTest);
    mockery.disable();
    resetMocks();
    return objectUnderTest;
}

resetMocks();

test('grantAccessToken exists', function(t){
    t.plan(2);

    var grantAccessToken = getCleanTestObject();

    t.ok(grantAccessToken, 'grantAccessToken Exists');
    t.equal(typeof grantAccessToken, 'function', 'grantAccessToken is a function');
});

test('grantAccessToken requires grant_type', function(t){
    t.plan(1);

    var context = {
            grant_type: undefined
        },
        grantAccessToken = getCleanTestObject();

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.invalidRequest(context), 'correct error and data');
    });
});

test('grantAccessToken IMPLICIT is an allowed grant_type', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.IMPLICIT
        },
        authServer = {
            clientService: {
                getById: function(){
                    t.pass('IMPLICIT grant type is allowed');
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(){
        t.fail('should not have called back');
    });
});

test('grantAccessToken AUTHORIZATIONCODE is not allowed grant_type if authorizationService not provided', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE
        },
        authServer = {
            authorizationService: null,
            clientService: {
                getById: function(){
                    t.fail('AUTHORIZATIONCODE grant type is allowed without authorizationService');
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.unsupportedGrantType(context), 'correct error and data');
    });
});

test('grantAccessToken AUTHORIZATIONCODE is allowed grant_type if authorizationService provided', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE
        },
        authServer = {
            authorizationService: {},
            clientService: {
                getById: function(){
                    t.pass('AUTHORIZATIONCODE grant type is allowed with authorizationService');
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(){
        t.fail('should not have called back');
    });
});

test('grantAccessToken CLIENTCREDENTIALS is not allowed grant_type if clientService provided', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.CLIENTCREDENTIALS
        },
        authServer = {
            clientService: null
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.unsupportedGrantType(context), 'correct error and data');
    });
});

test('grantAccessToken CLIENTCREDENTIALS is allowed grant_type if clientService provided', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.CLIENTCREDENTIALS
        },
        authServer = {
            clientService: {
                getById: function(){
                    t.pass('CLIENTCREDENTIALS grant type is allowed with clientService');
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(){
        t.fail('should not have called back');
    });
});

test('grantAccessToken PASSWORD is not allowed grant_type if membershipService not provided', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.PASSWORD
        },
        authServer = {
            membershipService: null,
            clientService: {
                getById: function(){
                    t.fail('PASSWORD grant type is allowed without membershipService');
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.unsupportedGrantType(context), 'correct error and data');
    });
});

test('grantAccessToken PASSWORD is allowed grant_type if membershipService provided', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.PASSWORD
        },
        authServer = {
            membershipService: {},
            clientService: {
                getById: function(){
                    t.pass('PASSWORD grant type is allowed with membershipService');
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(){
        t.fail('should not have called back');
    });
});

test('grantAccessToken handels get client by id error', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            client_id: 123
        },
        authServer = {
            authorizationService: {},
            clientService: {
                getById: function(clientId, callback){
                    callback(testError);
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.equal(error, testError, 'correct error');
    });
});

test('grantAccessToken handels invalid client', function(t){
    t.plan(1);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            client_id: 123
        },
        authServer = {
            authorizationService: {},
            clientService: {
                getById: function(clientId, callback){
                    callback();
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.invalidClient(context), 'correct error and data');
    });
});

test('grantAccessToken handels missing client grantTypes', function(t){
    t.plan(2);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            client_id: 123
        },
        client = {
            grantTypes: null
        },
        authServer = {
            authorizationService: {},
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.unsupportedGrantTypeForClient(context), 'correct error and data');
    });
});

test('grantAccessToken handels invalid client grantTypes', function(t){
    t.plan(2);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            client_id: 123
        },
        client = {
            grantTypes: [grantTypes.PASSWORD]
        },
        authServer = {
            authorizationService: {},
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.unsupportedGrantTypeForClient(context), 'correct error and data');
    });
});

test('grantAccessToken checks client secret if type AUTHORIZATIONCODE', function(t){
    t.plan(2);

    var context = {
            grant_type: grantTypes.AUTHORIZATIONCODE,
            client_id: 123,
            client_secret: 'foo'
        },
        client = {
            grantTypes: [grantTypes.AUTHORIZATIONCODE],
            secret: 'bar'
        },
        authServer = {
            authorizationService: {},
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.clientCredentialsInvalid(context), 'correct error and data');
    });
});

test('grantAccessToken checks client secret if type CLIENTCREDENTIALS', function(t){
    t.plan(2);

    var context = {
            grant_type: grantTypes.CLIENTCREDENTIALS,
            client_id: 123,
            client_secret: 'foo'
        },
        client = {
            grantTypes: [grantTypes.CLIENTCREDENTIALS],
            secret: 'bar'
        },
        authServer = {
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            }
        },
        grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, errors.clientCredentialsInvalid(context), 'correct error and data');
    });
});

test('grantAccessToken handels get token data error', function(t){
    t.plan(4);

    var context = {
            grant_type: grantTypes.CLIENTCREDENTIALS,
            client_id: 123,
            client_secret: 'foo'
        },
        client = {
            grantTypes: [grantTypes.CLIENTCREDENTIALS],
            secret: 'foo'
        },
        authServer = {
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            }
        };

    mockery.registerMock('./getTokenData', function(subContext, callback){
        t.equal(this, authServer, 'bound correctly');
        t.equal(subContext, context, 'correct context');

        callback(testError);
    });

    var grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, testError, 'correct error');
    });
});

test('grantAccessToken handels save token data error', function(t){
    t.plan(5);

    var context = {
            grant_type: grantTypes.CLIENTCREDENTIALS,
            client_id: 123,
            client_secret: 'foo'
        },
        client = {
            grantTypes: [grantTypes.CLIENTCREDENTIALS],
            secret: 'foo'
        },
        authServer = {
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            },
            authorizationService: {
                saveAccessToken: function(data, callback){
                    t.equal(data, tokenData, 'correct tokenData');
                    callback(testError);
                }
            }
        },
        tokenData = {
            accountId: 123,
            clientId: 456
        };

    mockery.registerMock('./getTokenData', function(subContext, callback){
        t.equal(this, authServer, 'bound correctly');
        t.equal(subContext, context, 'correct context');

        callback(null, tokenData);
    });

    var grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error){
        t.deepEqual(error, testError, 'correct error');
    });
});

test('grantAccessToken saves token data correctly', function(t){
    t.plan(8);

    var context = {
            grant_type: grantTypes.CLIENTCREDENTIALS,
            client_id: 123,
            client_secret: 'foo'
        },
        client = {
            grantTypes: [grantTypes.CLIENTCREDENTIALS],
            secret: 'foo'
        },
        authServer = {
            clientService: {
                getById: function(clientId, callback){
                    t.equal(clientId, context.client_id, 'got correct clientId');
                    callback(null, client);
                }
            },
            authorizationService: {
                saveAccessToken: function(data, callback){
                    t.equal(data, tokenData, 'correct tokenData');
                    callback(null, tokenData);
                }
            }
        },
        tokenData = {
            accountId: 123,
            clientId: 456
        };

    mockery.registerMock('./getTokenData', function(subContext, callback){
        t.equal(this, authServer, 'bound correctly');
        t.equal(subContext, context, 'correct context');

        callback(null, tokenData);
    });

    var grantAccessToken = getCleanTestObject().bind(authServer);

    grantAccessToken(context, function(error, result){
        t.notOk(error, 'no error');
        t.equal(result, tokenData, 'correct result');
        t.notOk(result.accountId, 'accountId was removed');
        t.notOk(result.clientId, 'clientId was removed');
    });
});