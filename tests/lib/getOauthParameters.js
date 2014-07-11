var test = require('grape'),
    pathToObjectUnderTest = '../../lib/getOauthParameters',
    getOauthParameters = require(pathToObjectUnderTest);

test('getOauthParameters exists and returns a function', function(t){
    t.plan(4);

    t.ok(getOauthParameters, 'getOauthParameters Exists');
    t.equal(typeof getOauthParameters, 'function', 'getOauthParameters is a function');

    var resultingFunction = getOauthParameters();

    t.ok(resultingFunction, 'resultingFunction Exists');
    t.equal(typeof resultingFunction, 'function', 'resultingFunction is a function');
});

test('getOauthParameters gets all context data from request and query string', function(t){
    t.plan(3);

    var authServer = {},
        endEvent,
        fakeRequest = {
            url: '/?meh=majigger&scope=qwe,asd',
            headers: {
                authorization: 'bearer 123456'
            },
            readable: true,
            on: function(event, callback){
                if(event === 'data'){
                    setTimeout(function(){
                        callback('foo=bar');
                        callback('&stuff=thing');
                        callback('&meh=ishouldntbehere');
                        endEvent();
                    }, 0);
                }

                if(event === 'end'){
                    endEvent = callback;
                }
            }
        },
        expectedContext = {
            foo: 'bar',
            stuff: 'thing',
            meh: 'majigger',
            access_token: '123456',
            scope: [
                'qwe',
                'asd'
            ]
        },
        scopedVersion = getOauthParameters.bind(authServer, function(){
            t.deepEqual(arguments[0], expectedContext, 'got correct context');
            t.equal(arguments[1], 'foo', 'arguments[1] correct');
            t.equal(arguments[2], 'bar', 'arguments[2] correct');
        }),
        resultingFunction = scopedVersion();

        resultingFunction(fakeRequest, 'foo', 'bar');
});

test('getOauthParameters handels no data from request', function(t){
    t.plan(3);

    var authServer = {},
        fakeRequest = {
            url: '/?meh=majigger&scope=qwe,asd',
            headers: {
                authorization: 'bearer 123456'
            },
            readable: true,
            on: function(event, callback){
                if(event === 'end'){
                    callback();
                }
            }
        },
        expectedContext = {
            meh: 'majigger',
            access_token: '123456',
            scope: [
                'qwe',
                'asd'
            ]
        },
        scopedVersion = getOauthParameters.bind(authServer, function(){
            t.deepEqual(arguments[0], expectedContext, 'got correct context');
            t.equal(arguments[1], 'foo', 'arguments[1] correct');
            t.equal(arguments[2], 'bar', 'arguments[2] correct');
        }),
        resultingFunction = scopedVersion();

        resultingFunction(fakeRequest, 'foo', 'bar');
});

test('getOauthParameters handels access_token in url', function(t){
    t.plan(3);

    var authServer = {},
        fakeRequest = {
            url: '/?meh=majigger&scope=qwe,asd&access_token=123456',
            readable: false
        },
        expectedContext = {
            meh: 'majigger',
            access_token: '123456',
            scope: [
                'qwe',
                'asd'
            ]
        },
        scopedVersion = getOauthParameters.bind(authServer, function(){
            t.deepEqual(arguments[0], expectedContext, 'got correct context');
            t.equal(arguments[1], 'foo', 'arguments[1] correct');
            t.equal(arguments[2], 'bar', 'arguments[2] correct');
        }),
        resultingFunction = scopedVersion();

        resultingFunction(fakeRequest, 'foo', 'bar');
});


test('getOauthParameters gets all context data from request and query string', function(t){
    t.plan(1);

    var authServer = {},
        endEvent,
        destroyed,
        fakeRequest = {
            url: '/?meh=majigger&scope=qwe,asd',
            headers: {
                authorization: 'bearer 123456'
            },

            readable: true,
            on: function(event, callback){
                if(destroyed){
                    return;
                }

                if(event === 'data'){
                    setTimeout(function(){
                        for (var i = 0; i < 1e6 + 2; i++) {
                            if(destroyed){
                                break;
                            }
                            callback('1');
                        }

                        endEvent();
                    }, 0);
                }

                if(event === 'end'){
                    endEvent = function(){
                        if(!destroyed){
                            callback();
                        }
                    };
                }
            },
            connection: {
                destroy: function() {
                    t.pass('connection destroyed');
                    destroyed = true;
                }
            }
        },
        scopedVersion = getOauthParameters.bind(authServer, function(){
            t.fail('should have destroyed connection');
        }),
        resultingFunction = scopedVersion();

        resultingFunction(fakeRequest);
});