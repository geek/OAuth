exports.invalidRequest = function(state) {
	return {
		error: 'The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed.',
		state: state
	};
}
exports.unauthorizedClient = function(state) {
	return {
		error: 'The client is not authorized to request an authorization code using this method.',
		state: state
	};
}
exports.accessDenied = function(state) {
	return {
		error: 'The resource owner or authorization server denied the request.',
		state: state
	};
}	
exports.unsupportedResponseType = function(state) {
	return {
		error: 'The authorization server does not support obtaining an authorization code using this method.',
		state: state
	};
}
exports.redirectUriMismatch = function(state) {
	return {
		error: 'The redirect URI doesn\'t match what is stored for this client',
		state: state
	};
}
exports.invalidScope = function(state) {
	return {
		error: 'The scope is not valid for this client',
		state: state
	};
}
exports.clientCredentialsInvalid = function(state) {
	return {
		error: 'The client credentials are invalid',
		state: state
	};
}
exports.userCredentialsInvalid = function(state) {
	return { 
		error: 'The user credentials are invalid',
		state: state
	};
}
exports.unsupportedGrantType = function(state) {
	return {
		error: 'The grant type is invalid',
		state: state
	};
}
exports.unsupportedGrantTypeForClient = function(state) {
	return {
		error: 'The grant type is not supported for this client',
		state: state
	};
}
exports.invalidAuthorizationCode = function(state) {
	return {
		error: 'The authorization code is invalid or expired',
		state: state
	};
}
exports.cannotRequestImplicitToken = function(state) {
	return {
		error: 'You cannot request a token from this endpoint using the implicit grant type',
		state: state
	};
}
exports.deviceAuthorizationPending = function(state) {
	return {
		error: 'authorization_pending',
		state: state
	};
}
exports.deviceAuthorizationDeclined = function(state) {
	return {
		error: 'authorization_declined',
		state: state
	};
}
exports.deviceAuthorizationSlowDown = function(state) {
	return {
		error: 'slow_down',
		state: state
	};
}
exports.deviceAuthorizationNotFound = function(state) {
	return {
		error: 'No code found',
		state: state
	};
}