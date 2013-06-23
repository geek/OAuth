var flatiron = require('flatiron'),
	restful = require('restful'),
	resourceful = require('resourceful'),
    path = require('path'),
    http = require('http');
    app = flatiron.app,
    creature = require('./lib/resources/creature.js');

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.resourceful, {
  dir: path.join(__dirname, 'lib', 'resources'),
  engine: 'memory'
});

app.use(flatiron.plugins.http);

resourceful.resources = {};
resourceful.resources.Creature = creature;

//console.log(resourceful);
restful.createRouter([creature]);

app.start(process.env.port || 3000, function(err) {
	if (err)
		throw err;

	var addr = app.server.address();
	app.log.info('Listening on http://' + addr.address + ':' + addr.port);
});