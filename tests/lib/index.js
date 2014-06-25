var test = require('grape'),
    mockery = require('mockery'),
    pathToObjectUnderTest = '../../lib';

mockery.registerAllowables([pathToObjectUnderTest]);

function resetMocks(){
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

test('simple default case', function(t){
    t.plan(1);

    var AuthServer = getCleanTestObject();

    t.equal(typeof AuthServer, 'function', 'AuthServer is a function');
});