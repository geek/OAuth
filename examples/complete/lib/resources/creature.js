var resourceful = require('resourceful'),
	restful = require('restful');

exports.Creature = resourceful.define('creature', function () {

  var self = this;
  
  this.restful = true;
  //
  // Specify a storage engine
  //
  this.use('memory');
  //this.use('couchdb', {database: "test3" })

  //
  // Specify some properties with validation
  //
  this.string('type');
  this.string('description');

  //
  // Specify timestamp properties
  //
  this.timestamps();
  this.number('life');

  this.feed = function (_id, options, callback) {
    self.get(_id, function(err, creature){
      if(err) {
        return callback(err);
      }
      var life = creature.life + 1;
      self.update(_id, { life: life }, function(err, result){
        callback(null, 'I have been fed my life is: ' + result.life);
      });
    });
  }
  this.feed.remote = true;

  this.hit = function (_id, options, callback) {
    self.get(_id, function(err, creature){
      if(err) {
        return callback(err);
      }
      var life = creature.life - 1;
      self.update(_id, { life: life }, function(err, result){
        callback(null, 'I have been hit my life is: ' + result.life);
      });
    });
  }
  this.hit.remote = true;


  this._die = function (food) {
    //
    // Remark: We'll consider the _die function "private",
    // in the sense that restful will not expose it
    //
    console.log('creature died.');
  }
  //
  // _die is not set to remote, so it won't be exposed
  //
});