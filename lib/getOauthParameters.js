var url = require('url'),
    queryString = require('querystring');

function getPostData(request, callback){
    if(!request.readable){
        return callback();
    }

    var data = '';

    request.on('data',function(chunk){
        if(data.length > (1e6)){
            // flood attack, kill.
            return request.connection.destroy();
        }
        data += chunk.toString();
    });

    request.on('end', function(){
        if (data) {
            return callback(null, queryString.parse(data));
        }

        callback();
    });
}

function getBearerToken(request) {
    if (request && request.headers && request.headers.authorization &&
        request.headers.authorization.toLowerCase().indexOf('bearer ') === 0) {
        return request.headers.authorization.split(' ').pop();
    }
}

function getOauthParameters(callback) {
    return function(){
        var authServer = this,
            args = Array.prototype.slice.call(arguments),
            request = args.shift();

        getPostData(request, function(error, data){
            if(error){
                // non error callback but non valid context so OAuth errors will be returned.
                return callback(error);
            }

            if(!data){
                data = {};
            }

            var query = url.parse(request.url, true).query;

            for(var key in query){
                data[key] = query[key];
            }

            if(data.scope){
                data.scope = data.scope.split(',');
            }

            if(!data.access_token){
                data.access_token = getBearerToken(request);
            }

            args.unshift(data);

            callback.apply(authServer, args);
        });
    };
}

module.exports = getOauthParameters;