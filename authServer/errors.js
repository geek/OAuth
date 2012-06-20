var invalidRequest = function(state) {
		return {
			error: 'The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed.',
			state: state
		};
	},
	unauthorizedClient = function(state) {
		return {
			error: 'The client is not authorized to request an authorization code using this method.',
			state: state
		};
	},
	accessDenied = function(state) {
		return {
			error: 'The resource owner or authorization server denied the request.',
			state: state
		};
	},
	unsupportedResponseType = function(state) {
		return {
			error: 'The authorization server does not support obtaining an authorization code using this method.',
			state: state
		};
	},
	redirectUriMismatch = function(state) {
		return {
			error: 'The redirect URI doesn\'t match what is stored for this client',
			state: state
		};
	},
	invalidScope = function(state) {
		return {
			error: 'The scope is not valid for this client',
			state: state
		};
	},
	clientCredentialsInvalid = function(state) {
		return {
			error: 'The client credentials are invalid',
			state: state
		};
	},
	userCredentialsInvalid = function(state) {
		return { 
			error: 'The user credentials are invalid',
			state: state
		};
	},
	unsupportedGrantType = function(state) {
		return {
			error: 'The grant type is invalid',
			state: state
		};
	},
	unsupportedGrantTypeForClient = function(state) {
		return {
			error: 'The grant type is not supported for this client',
			state: state
		};
	},
	invalidAuthorizationCode = function(state) {
		return {
			error: 'The authorization code is invalid or expired',
			state: state
		};
	},
	cannotRequestImplicitToken = function(state) {
		return {
			error: 'You cannot request a token from this endpoint using the implicit grant type',
			state: state
		};
	};

exports.errors = {
	invalidRequest: invalidRequest,
	unauthorizedClient: unauthorizedClient,
	accessDenied: accessDenied,
	unsupportedResponseType: unsupportedResponseType,
	redirectUriMismatch: redirectUriMismatch,
	invalidScope: invalidScope,
	invalidAuthorizationCode: invalidAuthorizationCode,
	cannotRequestImplicitToken: cannotRequestImplicitToken,
	clientCredentialsInvalid: clientCredentialsInvalid,
	userCredentialsInvalid: userCredentialsInvalid,
	unsupportedGrantType: unsupportedGrantType,
	unsupportedGrantTypeForClient: unsupportedGrantTypeForClient
};