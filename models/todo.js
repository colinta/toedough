var _ = require('underscore');
var moment = require('moment');
var app = require('../toedough');
var todos_ref = app.todos_ref;

var Todo = function(id, val) {
  this.id = id;
  this.ref = todos_ref.child(this.id);
  var self = this;

  if ( val ) {
    this.update(val);
  }
  else {
    this.done = false;
    this.done_at = null;
    this.due_at = null;
    this.title = 'New Todo';
    this.owner = my_id;
  }
};

Todo.prototype.update = function(val) {
  _(['title', 'owner']).each(function(key) {
    this[key] = val[key];
  }, this);
  this.done_at = val.done_at && moment.unix(val.done_at);
  this.due_at = val.due_at && moment.unix(val.due_at);
  this.done = !!this.done_at;
};

Todo.prototype.setDone = function(done) {
  if ( done) {
    this.done_at = moment().unix();
    this.ref.child('done_at').set(this.done_at);
  }
  else {
    this.done_at = null;
    this.ref.child('done_at').remove();
  }
  this.done = done;
  return this.done;
};

Todo.prototype.toggle = function() {
  return this.setDone(!this.done);
};

Todo.prototype.toString = function() {
  return 'Todo(title: ' + this.title + ', done? ' + (this.done ? 'yes' : 'no') + ')';
}

module.exports = Todo;
