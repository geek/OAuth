function validateAccessToken(context, callback) {
    this.authorizationService.getAccessToken(context.access_token, function (error, tokenData) {
        if(error){
            return callback(error);
        }

        if (!tokenData || !tokenData.access_token || context.client_id !== tokenData.clientId) {
            return callback({
                isValid: false,
                error: 'Access token not found'
            });
        }

        if (tokenData.expiresDate < new Date()) {
            return callback({
                isValid: false,
                error: 'Access token has expired'
            });
        }

        callback(
            null,
            {
                isValid: true,
                accountId: tokenData.accountId,
                clientId: tokenData.clientId
            }
        );
    });
}

module.exports = validateAccessToken;