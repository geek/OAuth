var http = require('http'),
    port = 8080,
    server = http.createServer(),
    beeline = require('beeline'),
    supportedScopes = ['profile', 'status', 'avatar'],
    expiresIn = 3600,
    OAuthServer = require('../'),
    services = require('./services'),
    oauthServer = new OAuthServer(
        services.clientService,
        services.tokenService,
        services.authorizationService,
        services.membershipService,
        expiresIn,
        supportedScopes
    );

function authorize(request, response) {
    oauthServer.authorizeRequest(request, 'accountid', function(error, authorizationResult) {
        if(error){
            response.statusCode = 400;
            return response.end(JSON.stringify(error));
        }

        // var code = require('url').parse(authorizationResult.redirectUri, true).query.code;
        // response.statusCode = 302;
        // response.setHeader('Location', 'http://localhost:8080/oauth/token?client_id=1&grant_type=authorization_code&client_secret=kittens&code=' + code);

        response.end(JSON.stringify(authorizationResult));
    });
}

function grantToken(request, response) {
    oauthServer.grantAccessToken(request, function(error, token) {
        if(error){
            response.statusCode = 400;
            return response.end(JSON.stringify(error));
        }

        response.end(JSON.stringify(token));
    });
}

function apiEndpoint(request, response) {
    oauthServer.validateAccessToken(request, function(error, validationResult) {
        if(error){
            response.statusCode = 401;
            return response.end(JSON.stringify(error));
        }

        response.end(JSON.stringify(validationResult));
    });
}


var routes = {
    '/oauth/authorize': authorize,
    '/oauth/token': grantToken,
    '/api/test': apiEndpoint
};

server.on('request', beeline.route(routes));

server.listen(port, function(error){
    if(error){
        console.error(error);
        return process.exit(-1);
    }

    console.log('Listening on port: ' + port);
});