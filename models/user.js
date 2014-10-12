var _ = require('underscore');
var moment = require('moment');
var app = require('../toedough');
var users_ref = app.users_ref;

var User = function(id, val) {
  if ( !(this instanceof User) ) {
    retval = User.from_cache(id);
    if ( retval ) {
      if ( val ) {
        retval.update(val);
      }
      return retval;
    }

    return new User(id, val);

    return user;
  }

  this.id = User.get_name(id);
  User.into_cache(this);

  this.ref = users_ref.child(this.id);
  var self = this;

  if ( val ) {
    this.update(val);
  }
}

var _user_cache = {};

User.cache = function() {
  return _user_cache;
};

User.from_cache = function(id) {
  var id = User.get_name(id);
  return _user_cache[id];
};

User.into_cache = function(user) {
  _user_cache[user.id] = user;
};

User.get_name = function(id) {
  return id;
};

User.prototype.update = function(val) {
  _(['name']).each(function(key) {
    this[key] = val[key];
  }, this);
};

module.exports = User;
