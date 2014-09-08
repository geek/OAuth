var test = require('grape'),
    mockery = require('mockery'),
    pathToObjectUnderTest = '../../lib',
    fakeAuthorizeRequest = function(){},
    fakeGetTokenData = function(){},
    fakeGrantAccessToken = function(){},
    fakeValidateAccessToken = function(){};

mockery.registerAllowables([pathToObjectUnderTest]);

function resetMocks(){
    mockery.registerMock('./getOauthParameters', function(){});
    mockery.registerMock('./authorizeRequest', fakeAuthorizeRequest);
    mockery.registerMock('./getTokenData', fakeGetTokenData);
    mockery.registerMock('./grantAccessToken', fakeGrantAccessToken);
    mockery.registerMock('./validateAccessToken', fakeValidateAccessToken);
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

test('lib Exists', function (t) {
    t.plan(2);
    var lib = getCleanTestObject();
    t.ok(lib, 'lib Exists');
    t.equal(typeof lib, 'object',  'lib is an object');
});

test('lib loads all methods and wraps in getOauthParameters', function (t) {
    t.plan(8);

    var methods = [
            fakeAuthorizeRequest,
            fakeGetTokenData,
            fakeGrantAccessToken,
            fakeValidateAccessToken
        ],
        count= 0;

    mockery.registerMock('./getOauthParameters', function(method){
        t.equal(method, methods[count], 'called getOauthParameters ' + (count + 1) + ' time(s)');
        count++;
        return method;
    });


    var lib = getCleanTestObject();

    t.equal(lib.authorizeRequest, fakeAuthorizeRequest, 'lib exposes authorizeRequest');
    t.equal(lib.getTokenData, fakeGetTokenData, 'lib exposes getTokenData');
    t.equal(lib.grantAccessToken, fakeGrantAccessToken, 'lib exposes grantAccessToken');
    t.equal(lib.validateAccessToken, fakeValidateAccessToken, 'lib exposes validateAccessToken');
});

require('./authorizeRequest');
require('./errors');
require('./getOauthParameters');
require('./getTokenData');
require('./grantAccessToken');
require('./grantTypes');
require('./validateAccessToken');