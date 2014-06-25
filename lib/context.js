module.exports = function (request) {

    function getParam(paramName) {
        if (request.query && request.query[paramName] !== undefined) {
            return request.query[paramName];
        }
        else if (request.body && request.body[paramName] !== undefined) {
            return request.body[paramName];
        }

        return null;
    }

    function getAccessToken() {
        if (getParam('access_token')) {
            return getParam('access_token');
        }

        if (!request || !request.headers || !request.headers.authorization) {
            return null;
        }

        var authHeader = request.headers.authorization;
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
    }

    return request ? {
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