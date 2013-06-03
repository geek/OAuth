module.exports = function (req) {

    var getParam = function (paramName) {

        if (req.query && req.query[paramName] !== undefined) {
            return req.query[paramName];
        }
        else if (req.body && req.body[paramName] !== undefined) {
            return req.body[paramName];
        }

        return null;
    };

    var getAccessToken = function () {

        if (getParam('access_token')) {
            return getParam('access_token');
        }

        if (!req || !req.headers || !req.headers.authorization) {
            return null;
        }

        var authHeader = req.headers.authorization;
        var startIndex = authHeader.toLowerCase().indexOf('bearer ');

        if (startIndex === -1) {
            return null;
        }

        var bearer = authHeader.substring(startIndex + 7);
        var spaceIndex = bearer.indexOf(' ');

        if (spaceIndex > 0) {
            bearer = bearer.substring(0, spaceIndex);
        }

        return bearer;
    };

    return req ? {
        responseType: getParam('response_type'),
        clientId: getParam('client_id'),
        clientSecret: getParam('client_secret'),
        code: getParam('code'),
        grantType: getParam('grant_type'),
        state: getParam('state'),
        password: getParam('password'),
        scope: getParam('scope') ? getParam('scope').split(',') : null,
        redirectUri: getParam('redirect_uri'),
        access_token: getAccessToken(),
        userName: getParam('username')
    } : null;
};