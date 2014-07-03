var test = require('grape'),
    mockery = require('mockery'),
    timekeeper = require('timekeeper'),
    pathToObjectUnderTest = '../',
    testClientService = {},
    testTokenService = {},
    testAuthorizationService = {},
    testMembershipService = {},
    testExpiresIn = 123456,
    testSupportedScopes = ['foo', 'bar', 'meh'];

mockery.registerAllowables([pathToObjectUnderTest]);

function resetMocks(){
    mockery.registerMock('./lib', {
        authorizeRequest: function(){},
        getTokenData: function(){},
        grantAccessToken: function(){},
        validateAccessToken: function(){}
    });
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

test('AuthServer exists', function(t){
    t.plan(1);

    var AuthServer = getCleanTestObject();

    t.equal(typeof AuthServer, 'function', 'AuthServer is a function');
});

test('AuthServer constructs correct object', function(t){
    t.plan(7);

    var AuthServer = getCleanTestObject(),
        result = new AuthServer(
            testClientService,
            testTokenService,
            testAuthorizationService,
            testMembershipService,
            testExpiresIn,
            testSupportedScopes
        );

    t.equal(result.clientService, testClientService, 'got correct clientService');
    t.equal(result.tokenService, testTokenService, 'got correct tokenService');
    t.equal(result.authorizationService, testAuthorizationService, 'got correct authorizationService');
    t.equal(result.membershipService, testMembershipService, 'got correct membershipService');
    t.equal(result.expiresIn, testExpiresIn, 'got correct expiresIn');

    t.equal(typeof result.isSupportedScope, 'function', 'isSupportedScope is a function');
    t.equal(typeof result.getExpiresDate, 'function', 'isSupportedScope is a function');
});

test('AuthServer constructs correct object without new keyword', function(t){
    t.plan(7);

    var AuthServer = getCleanTestObject(),
        result = AuthServer(
            testClientService,
            testTokenService,
            testAuthorizationService,
            testMembershipService,
            testExpiresIn,
            testSupportedScopes
        );

    t.equal(result.clientService, testClientService, 'got correct clientService');
    t.equal(result.tokenService, testTokenService, 'got correct tokenService');
    t.equal(result.authorizationService, testAuthorizationService, 'got correct authorizationService');
    t.equal(result.membershipService, testMembershipService, 'got correct membershipService');
    t.equal(result.expiresIn, testExpiresIn, 'got correct expiresIn');

    t.equal(typeof result.isSupportedScope, 'function', 'isSupportedScope is a function');
    t.equal(typeof result.getExpiresDate, 'function', 'isSupportedScope is a function');
});

test('AuthServer.isSupportedScope returns based on provided Supported Scopes', function(t){
    t.plan(5);

    var AuthServer = getCleanTestObject(),
        withScopes = new AuthServer(
            null,
            null,
            null,
            null,
            null,
            testSupportedScopes
        ),
        withoutScopes = new AuthServer();

    t.equal(withScopes.isSupportedScope(), false, 'isSupportedScope returns false if undefined');
    t.equal(withScopes.isSupportedScope([testSupportedScopes[0], 'majigger']), false, 'isSupportedScope returns false if atleast 1 is invalid');
    t.equal(withScopes.isSupportedScope(testSupportedScopes), true, 'isSupportedScope returns true if valid');
    t.equal(withScopes.isSupportedScope(testSupportedScopes[0]), true, 'isSupportedScope handels a string');

    t.equal(withoutScopes.isSupportedScope(testSupportedScopes), false, 'isSupportedScope returns false if none provided');
});

test('AuthServer.getExpiresDate returns based on provided expiresIn value', function(t){
    t.plan(4);

    var AuthServer = getCleanTestObject(),
        now = new Date(),
        expectedWithExpires = now.getTime() + testExpiresIn * 60000,
        expectedWithoutExpires = now.getTime() + 3600 * 60000,
        withExpiresValue,
        withoutExpiresValue;

    timekeeper.freeze(now);

    withExpiresValue = new AuthServer(null, null, null, null, testExpiresIn);
    withoutExpiresValue = new AuthServer();

    t.ok(withExpiresValue.getExpiresDate() instanceof Date, 'getExpiresDate returns a Date object when provided Expires');
    t.equal(+withExpiresValue.getExpiresDate(), expectedWithExpires, 'getExpiresDate returns now + provided Expires');
    t.ok(withoutExpiresValue.getExpiresDate() instanceof Date, 'getExpiresDate returns a Date object when not provided Expires');
    t.equal(+withoutExpiresValue.getExpiresDate(), expectedWithoutExpires, 'getExpiresDate returns now + default Expires');

    timekeeper.reset();
});

test('AuthServer.prototype.authorizeRequest exists', function(t){
    t.plan(1);

    var AuthServer = getCleanTestObject();

    t.equal(typeof AuthServer.prototype.authorizeRequest, 'function', 'AuthServer.prototype.authorizeRequest is a function');
});

test('AuthServer.prototype.getTokenData exists', function(t){
    t.plan(1);

    var AuthServer = getCleanTestObject();

    t.equal(typeof AuthServer.prototype.getTokenData, 'function', 'AuthServer.prototype.getTokenData is a function');
});

test('AuthServer.prototype.grantAccessToken exists', function(t){
    t.plan(1);

    var AuthServer = getCleanTestObject();

    t.equal(typeof AuthServer.prototype.grantAccessToken, 'function', 'AuthServer.prototype.grantAccessToken is a function');
});

test('AuthServer.prototype.validateAccessToken exists', function(t){
    t.plan(1);

    var AuthServer = getCleanTestObject();

    t.equal(typeof AuthServer.prototype.validateAccessToken, 'function', 'AuthServer.prototype.validateAccessToken is a function');
});