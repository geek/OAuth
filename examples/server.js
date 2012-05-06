var oauth = require('../server/oauthService.js'),
	connect = require('connect'),
	util = require('util');

var clients = {
		'1': {
			id: '1',
			secret: 'what',
			isValidRedirectUri: function(uri) { return true; }
		}
	},
	clientService = {
		getById: function(id) {
			return clients[id];
		}
	},
	tokenService = {
		generateToken: function() { return 'blah'; }
	},
	authorizationService = {
		saveAuthorizationCode: function(code) {

		}
	};

var authorize = function(req, res) {
		service = oauth.service(clientService, tokenService, authorizationService, 3600);
		var oauthUri = service.authorizeRequest(req, '123');
		res.write(util.inspect(oauthUri));
		res.end();
	};

var server = connect()
		.use(connect.query())
		.use(connect.bodyParser())
		.use('/oauth/authorize', authorize).listen(8001);

console.log('listening on port 8001');