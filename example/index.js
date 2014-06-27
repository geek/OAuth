var http = require('http'),
    port = 8080,
    server = http.createServer(),
    beeline = require('beeline'),
    supportedScopes = [ 'profile', 'status', 'avatar'],
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
    oauthServer.authorizeRequest(request, 'userid', function(authorizationResult) {
        response.end(JSON.stringify(authorizationResult));
    });
}

function grantToken(request, response) {
    oauthServer.grantAccessToken(request, 'userid', function(token) {
        response.end(JSON.stringify(token));
    });
}

function apiEndpoint(request, response) {
    oauthServer.validateAccessToken(request, function(validationResult) {
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