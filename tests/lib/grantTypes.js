var test = require('grape'),
    pathToObjectUnderTest = '../../lib/grantTypes',
    grantTypes = require(pathToObjectUnderTest);

test('grantTypes exists and has correct constants', function(t){
    t.plan(5);

    t.equal(typeof grantTypes, 'object', 'grantTypes is an object');

    t.equal(grantTypes.PASSWORD, 'password', 'PASSWORD has correct value');
    t.equal(grantTypes.IMPLICIT, 'implict', 'IMPLICIT has correct value');
    t.equal(grantTypes.AUTHORIZATIONCODE, 'authorization_code', 'AUTHORIZATIONCODE has correct value');
    t.equal(grantTypes.CLIENTCREDENTIALS, 'client_credentials', 'CLIENTCREDENTIALS has correct value');
});
