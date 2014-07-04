var test = require('grape'),
    pathToObjectUnderTest = '../../lib/validateAccessToken',
    timekeeper = require('timekeeper'),
    validateAccessToken = require(pathToObjectUnderTest);

test('validateAccessToken Exists', function (t) {
    t.plan(2);

    t.ok(validateAccessToken, 'validateAccessToken Exists');
    t.equal(typeof validateAccessToken, 'function',  'validateAccessToken is a function');
});

test('validateAccessToken gets token and calls back correct data', function (t) {
    t.plan(5);

    var now = new Date(),
        testContext = {
            access_token: 123,
            client_id: 456
        },
        testTokenData = {
            access_token: 123,
            clientId: 456,
            accountId: 789,
            expiresDate: new Date(now.getTime() + 9999999)
        },
        testAuthServer = {
            authorizationService: {
                getAccessToken: function(token, callback){
                    t.equal(token, testContext.access_token, 'got correct token');
                    callback(null, testTokenData);
                }
            }
        };

    timekeeper.freeze(now);

    validateAccessToken.call(testAuthServer, testContext, function(error, result){
        t.notOk(error, 'no error');
        t.ok(result.isValid, 'isValid');
        t.equal(result.accountId, testTokenData.accountId, 'got correct accountId');
        t.equal(result.clientId, testTokenData.clientId, 'got correct clientId');
    });

    timekeeper.reset();
});

test('validateAccessToken returns error if no token data', function (t) {
    t.plan(2);

    var testContext = {},
        testTokenData = null,
        expectedError = {
            isValid: false,
            error: 'Access token not found'
        },
        testAuthServer = {
            authorizationService: {
                getAccessToken: function(token, callback){
                    callback(null, testTokenData);
                }
            }
        };

    validateAccessToken.call(testAuthServer, testContext, function(error, result){
        t.deepEqual(error, expectedError, 'got correct error details');
        t.notOk(result, 'no result');
    });
});

test('validateAccessToken returns error if no access_token', function (t) {
    t.plan(2);

    var testContext = {},
        testTokenData = {
            access_token: null
        },
        expectedError = {
            isValid: false,
            error: 'Access token not found'
        },
        testAuthServer = {
            authorizationService: {
                getAccessToken: function(token, callback){
                    callback(null, testTokenData);
                }
            }
        };

    validateAccessToken.call(testAuthServer, testContext, function(error, result){
        t.deepEqual(error, expectedError, 'got correct error details');
        t.notOk(result, 'no result');
    });
});

test('validateAccessToken returns error if clientIds dont match', function (t) {
    t.plan(2);

    var testContext = {
            client_id: 999
        },
        testTokenData = {
            access_token: 123,
            clientId: 456,
        },
        expectedError = {
            isValid: false,
            error: 'Access token not found'
        },
        testAuthServer = {
            authorizationService: {
                getAccessToken: function(token, callback){
                    callback(null, testTokenData);
                }
            }
        };

    validateAccessToken.call(testAuthServer, testContext, function(error, result){
        t.deepEqual(error, expectedError, 'got correct error details');
        t.notOk(result, 'no result');
    });
});

test('validateAccessToken returns error if expired', function (t) {
    t.plan(2);

    var now = new Date(),
        testContext = {
            client_id: 456
        },
        testTokenData = {
            access_token: 123,
            clientId: 456,
            expiresDate: now
        },
        expectedError = {
            isValid: false,
            error: 'Access token has expired'
        },
        testAuthServer = {
            authorizationService: {
                getAccessToken: function(token, callback){
                    callback(null, testTokenData);
                }
            }
        };

    timekeeper.freeze(new Date(now.getTime() + 9999999));

    validateAccessToken.call(testAuthServer, testContext, function(error, result){
        t.deepEqual(error, expectedError, 'got correct error details');
        t.notOk(result, 'no result');
    });

    timekeeper.reset();
});