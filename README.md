# Simple OAuth Server

This is based on [OAuth](https://github.com/wpreul/OAuth) but now supports error first, async calls for all service methods.

## Installation

`npm install simple-oauth-server`

## Usage

    var OAuthServer = require('simple-oauth-server'),
    oauthServer = new OAuthServer(
        clientService,
        tokenService,
        authorizationService,
        membershipService,
        3600,
        ['profile', 'status', 'avatar']
    );

See [Example](#example) for an actual usage senario

## Expectations

You will need to construct the Simple OAuth Server object by passing in the following parameters.

1. TokenService object with the below signature. This service is used to generate unique tokens and authentication codes.

        {
            generateToken: function(callback) {},  // callback error or a token
            generateAuthorizationCode: function(callback) {}  // callback error or a authorization code
        }

2. ClientService object with the below signature.  getById will be passed an ID and will be expected to pass a client object to the callback function.

        {
            getById: function(id, callback) {},  // callback error or a client object
            isValidRedirectUri: function(client, requestedUri) {}  // return true or false if the request uri is valid
        }

    A client object should have the following properties at a minimum:

        {
            id: '1',  // unique identifier
            secret: 'kittens',  // seceret key
            grantTypes: ['implicit', 'password', 'client_credentials', 'authorization_code']   // array of supported grant types
        }

    A client should also store valid redirect domain(s) to ensure the user is only redirected to valid domains.  As this could be one or many and storage may differ the isValidRedirectUri function needs to be implemented as above.

3. MembershipService object with the below signature.

        {
            areUserCredentialsValid: function(userName, password, scope, callback) {} // callback error or a boolean indicating of the credentals are valid
        }

    The membership service is only used if the `password` grant type is supported, if not it can be passed as null.


5. An object passed in the authorizationService parameter with the following functions:

        {
            saveAuthorizationCode: function(codeData, callback) {},  // callback error or code object
            saveAccessToken: function(tokenData, callback) {},  // callback error or token object
            getAuthorizationCode: function(code, callback) {},  // callback error or code object
            getAccessToken: function(token, callback) {}  // callback error or token object
        }

    An authorization code object should have these properties at a minimum:

        {
            code: '2ac2ab84-bed8-4cd9-a255-54212074b7ce',  // complex unique identifier
            expiresDate: '2014-07-02T18:40:59.595Z'  // expiry date
        }

    A token object will have these properties when passed to the save function:

        {
            access_token: '9d357269-fe29-4ace-80b6-1ccc14744bd0',  // complex unique identifier
            expires_in: '2014-07-02T18:40:59.595Z'  // expiry date
            refresh_token: 'f961820e-ef0e-4ff9-8c89-bcebd95b2bda'  // optional complex unique identifier
        }

## Example

Please refer to the example folder for a demonstration of using the server.

The example uses `beeline` as a simple router and `node-uuid` to generate example tokens, but Simple OAuth Server does not do any route handling or token creation itself.

To use the example please navigate into the folder and run `npm install` to install the modules needed for the example. (You will also need to npm install in the root project directory)

Below are some manual steps you can run to show the example code in action.

1. Make a GET request to `http://localhost:8080/oauth/authorize?client_id=1&response_type=code&redirect_uri=http://google.com&scope=profile`

This will return an object similar to the below:

    {
        "redirectUri": "http://google.com?code=d494bbe3-d7e7-4f46-a2c7-ba1b680cae6c&expires_in=3600&scope=profile,"
    }

2. Using the output from step 1, make a GET request to `http://localhost:8080/oauth/token?client_id=1&grant_type=authorization_code&client_secret=kittens&code=[THE CODE FROM STEP 1]`

This will return an object similar to the below:

    {
        "token_type": "Bearer",
        "expires_in": "2014-06-29T18:49:00.332Z",
        "access_token": "a90cd0df-786d-4a8d-a7fc-5b6c7f08d555",
        "refresh_token": "2e1ae953-e1e6-439b-927f-7d4063760920"
    }

3. Using the output from step 2, make a GET request to `http://localhost:8080/api/test` with the `Authorization` header set to "Bearer [ACCESS TOKEN FROM STEP 2]"

This will return an object similar to the below:

    {
        "isValid":true
    }
