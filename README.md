# OAuth for Node
=====

## Contributors
The following individuals have been really helpful in getting this module where it is today.
 * @thatguydan
 * @polym0rph
 * @cbrammer

## Description

This is an authorization server implementation for the [v2-31 OAuth](http://tools.ietf.org/html/draft-ietf-oauth-v2-31) specification.  There is an example implementation in the examples folder for the server.  Eventually, I will add a client implementation for the latest specification, which is why it is simply named OAuth at this point. The four main grant types are all supported.  This means that you can allow implicit, client_credentials, authorization_code, and password grants.  It is up to you to implement the authorization page for a user.  This is generally found at /oauth/authorize.  It is also up to you to implement a service for storing client details and access tokens.  The OAuth provider assumes nothing about your server and therefore has no hard dependencies on anything outside of node.  That being said, there is the expectation that the query and body object you pass to OAuth is an object and not in its original string state.  You can achieve this easily by using the connect query middleware, as the example application shows.

## Install

You can install using npm:
```npm install auth-server```

I did have this published at OAuth, but after unpublishing the previous version npm wouldn't allow me to publish under this same name.  It looks like packages must be completely lowercase now :(

## Expectations

You will need to construct the OAuth object by passing in the following parameters.

1. An object passed in as the tokenService parameter that has a function named generateToken.  generateToken should return a unique string, which will be used for the access and refresh tokens.

2. An object passed in as the clientService parameter that has a function named getById.  getById will be passed an ID and will be expected to pass a client object to the callback function.

3. A client object should have the following:
  * id 
  * secret
  * grantTypes (array of allowed grant types for this client, you must pass implicit if you want to allow this type)
  * isValidRedirectUri (function that takes as a parameter a redirectUri)
    Because a client can have multiple valid redirect Uri's I have decided to put the responsibility of checking the uri on the client itself.  One reason for this is that it will allow desktop clients to return true if they want.

4. An object passed in as the membershipService parameter that has a function named areUserCredentialsValid.  This function should pass a boolean to the callback function to indicate if the passed in userId and password are valid.  This object is required if you want to allow the password grant type, otherwise you can pass null.  You will probably want to perform additional checks here to make sure the user is not locked out or banned.  Another suggestion is to log failed login attempts and lockout users after a set number of failed attempts to mitigate brute force attacks.

5. An object passed in the authorizationService parameter with the following functions:
  * saveAuthorizationCode(code, callback)
  * saveAccessToken(token, callback)
  * getAuthorizationCode(codeId, callback)

 An authorization code object should have these properties at a minimum:
   * code
   * expiresDate
 
 A token object will have these properties when passed to the save function:
   * accessToken
   * refreshToken
   * expiresIn (seconds when the access token expires)

## Example

Please refer to the examples folder for a demonstration of using the server.  The example uses connect, but the AuthServer doesn't actually have a dependency on anything outside of what ships with node.

To use the basic example please navigate into the folder and run ```npm install```  This will download and install any mising modules.  Also, you may need to run ```npm install auth-server``` in the basic folder.  For development I have used 'npm link' instead of using the package posted at npm.  Below are some manual steps you can run to check the authorization code grant type.

1. Make a get request to ```http://localhost:8001/oauth/authorize?client_id=1&response_type=code&redirect_uri=http://google.com&scope=profile```
2. Using the output from #1 make another request with the code to ```http://localhost:8001/oauth/token?client_id=1&grant_type=authorization_code&code=[THE CODE FROM STEP 1]&client_secret=what```
3. Using curl make a POST request with the Authorization header passing in the access token: ```curl http://localhost:8001/api/test -d "" -H "Authorization: Bearer [ACCESS TOKEN GOES HERE]"```

## Spec discussion

1. In the Access Token Request section (http://tools.ietf.org/html/draft-ietf-oauth-v2-31#section-4.1.3) of the latest spec it does state that a redirect_uri is required when making a request for an access_token but then it also states that the client must authenticate if it is confidential.  Since the authorization code grant type is for confidential clients this means that the expectation is for the client to both authenticate (pass id and secret) as well as the redirect_uri.  I disagree, this is obvious overkill.  Therefore, auth-server only expects that the client authenticate when requesting an access token using authorization code grant type.

2. It is assumed that by default you will be using the bearer token type.  This requires that all requests to your API to pass an Authorization header using Bearer as the type.  If you want to override this you are free to, but I think it is a good default to use.

3. In the spec I find it odd that clients using the implicit grant type are expected to handle redirection in the user agent but are not required to provide the redirection uri when making the request to the authorization endpoint.  Therefore, I have made the assumption with auth-server that all requests to the authorization endpoint are required to provide a redirect_uri parameter that is valid for the client.

4. So there is an odd amount of extra work involved in for a confidential client using the authorization_code grant type.  After a user authorizes a client to operate on their behalf the response is either a token or a code.  If it is a token then the client doesn't get a refresh token.  If it is a code then the client must make an extra request to get a token, but will also get a refresh token.  I have decided to provide a third option, which is surprisingly lacking from the spec.  This third option is to pass in response_type=code_and_token.  When the client does this it will get a token back that it can immediately use while at the same time making a request to the token endpoint to get a more permanent token with a refresh token.  I hope you will see this extra option as an improvement over the spec.