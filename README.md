# Simple OAuth Server

This is based on [OAuth](https://github.com/wpreul/OAuth) but now supports error first, async calls for all service methods.


## Example

Please refer to the example folder for a demonstration of using the server.

The example uses `beeline` as a simple router and `node-uuid` to generate example tokens, but Simple OAuth Server itself has no external dependencies.

To use the example please navigate into the folder and run `npm install` to install the modules needed for the example

Below are some manual steps you can run to show the example code in action.

1. Make a GET request to `http://localhost:8080/oauth/authorize?client_id=1&response_type=code&redirect_uri=http://google.com&scope=profile`
This will return an object similar to the below:

    {
        "redirectUri": "http://google.com?code=d494bbe3-d7e7-4f46-a2c7-ba1b680cae6c&expires_in=3600&scope=profile,"
    }

2. Using the output from step 1, make a GET request to `http://localhost:8080/oauth/token?client_id=1&grant_type=authorization_code&client_secret=kittens&code=[THE CODE FROM STEP 1]`
This will return an object similar to the below:

    {
        "access_token": "a90cd0df-786d-4a8d-a7fc-5b6c7f08d555",
        "token_type": "bearer",
        "expires_in": "2014-06-29T18:49:00.332Z",
        "refresh_token": "2e1ae953-e1e6-439b-927f-7d4063760920"
    }

3. Using the output from step 2, make a GET request to `http://localhost:8080/api/test` with the `Authorization` header set to "Bearer [ACCESS TOKEN FROM STEP 2]"
This will return an object similar to the below:

    {
        "isValid":true
    }
