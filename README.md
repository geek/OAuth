# OAuth for Node
=====

## Description

This is a server implementation for the [v2-25 OAuth](http://tools.ietf.org/html/draft-ietf-oauth-v2-25) specification.  There is an exmaple implementation in the examples folder for the server.  Eventually, I will add a client implementation for the latest specification, which is why it is simply named OAuth at this point. The four main grant types are allowed iAnf want them to be.  This means that you can allow implicit, client_credentials, authorization_code, and password grants.  It is up to you to implement the authorization page for a user.  This is generally found at /oauth/authorize.  It is also up to you to implement a service for storing client details and access tokens.  The OAuth provider assumes nothing about your server and therefore has no hard dependencies on anything outside of node.  That being said, there is the expectation that the query and body object you pass to OAuth is an object and not in its original string state.  You can achieve this easily by using the connect query middleware, as the example application shows.

## Expectations

You will need to construct the oauth object by passing in the following parameters.

1. An object passed in as the tokenService parameter that has a function named generateToken.  generateToken should return a unique string, which will be used for the access and refresh tokens.

2. An object passed in as the clientService parameter that has a function named getById.  getById will be passed an ID and will be expected to return a client object.

3. A client object should have the following:
  * id 
  * secret
  * grantTypes (array of allowed grant types for this client, you must pass implicit if you want to allow this type)
  * isValidRedirectUri (function that takes as a parameter a redirectUri)
    Because a client can have multiple valid redirect Uri's I have decided to put the responsibility of checking the uri on the client itself.  One reason for this is that it will allow desktop clients to return true if they want.

4. An object passed in as the membershipService parameter that has a function named areUserCredentialsValid.  This function should return a boolean to indicate if the passed in userId and password are valid.  This object is required if you want to allow the password grant type, otherwise you can pass null.  You will probably want to perform additional checks here to make sure the user is not locked out or banned.  Another suggestion is to log failed login attempts and lockout users after a set number of failed attempts to mitigate brute force attacks.

5. An object passed in the authorizationService parameter with the following functions:
  * saveAuthorizationCode(code)
  * saveAccessToken(token)
  * getAuthorizationCode(codeId)

 An authorization code object should have these properties at a minimum:
   * code
   * expiresDate
 
 A token object will have these properties when passed to the save function:
   * accessToken
   * refreshToken
   * expiresIn (seconds when the access token expires)

## Example

Please refer to the examples folder for a demonstration of using the server.