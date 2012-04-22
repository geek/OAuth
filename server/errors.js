exports = exports.module = errors;

var invalidRequest = function(context) {
		return {
			error: "The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed.",
			state: context.state
		};
	},
	unauthorizedClient = function(context) {
		return {
			error: "The client is not authorized to request an authorization code using this method.",
			state: context.state
		};
	},
	accessDenied = function(context) {
		return {
			error: "The resource owner or authorization server denied the request.",
			state: context.state
		};
	},
	unsupportedResponseType = function(context) {
		return {
			error: "The authorization server does not support obtaining an authorization code using this method.",
			state: context.state
		};
	},
	redirectUriMismatch = function(context) {
		return {
			error: "The redirect URI doesn't match what is stored for this client",
			state: context.state
		};
	},
	invalidScope = function(context) {
		return {
			error: "The scope is not valid for this client",
			state: context.state
		};
	}
	clientCredentialsInvalid = function(context) {
		return {
			error: "The client credentials are invalid",
			state: context.state
		};
	};

var errors = {
	invalidRequest,
	unauthorizedClient,
	accessDenied,
	unsupportedResponseType,
	redirectUriMismatch,
	invalidScope
};