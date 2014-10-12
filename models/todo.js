var _ = require('underscore');
var moment = require('moment');
var app = require('../toedough');
var todos_ref = app.todos_ref;

var Todo = function(id, val, parent) {
  if ( !(this instanceof Todo) ) {
    retval = Todo.from_cache(id, parent);
    if ( retval ) {
      if ( val ) {
        retval.update(val);
      }
      return retval;
    }

    return new Todo(id, val, parent);
  }

  this.id = Todo.get_name(id, parent);
  this.parent = parent;
  Todo.into_cache(this);

  this.ref = todos_ref.child(this.id);
  var self = this;

  this.expanded = false;

  if ( val ) {
    this.update(val);
  }
  else if ( ! id ) {
    this.created_at = moment();
    this.done_at = null;
    this.due_at = null;
    this.title = 'New Todo';
    this.owner = app.my_id;
    this.children = [];
  }
};

var _todo_cache = {};

Todo.cache = function() {
  return _todo_cache;
};

Todo.from_cache = function(id, parent) {
  var id = Todo.get_name(id, parent);
  return _todo_cache[id];
};

Todo.into_cache = function(todo) {
  _todo_cache[todo.id] = todo;
};

Todo.get_name = function(id, parent) {
  var id = id;
  if ( parent ) {
    return Todo.get_name(parent.id, parent.parent) + '/children/' + id;
  }
  return id;
};

Todo.prototype.isDone = function() {
  if ( this.hasChildren() ) {
    var allDone = true;
    this.children.forEach(function(child) {
      allDone = child.isDone();
      if ( !allDone ) { return; }
    }, this);
    return allDone;
  }
  else{
    return !!this.done_at;
 }
};

Todo.prototype.isExpanded = function() {
  return this.expanded;
};

Todo.prototype.isExpandable = function() {
  return this.hasChildren();
};

Todo.prototype.expand = function() {
  if ( this.isExpandable() ) {
    this.expanded = ! this.expanded;
  }
  else {
    this.expanded = false;
  }

  return this.isExpanded();
};

Todo.prototype.hasChildren = function() {
  return this.children && this.children.length > 0;
};

Todo.prototype.numParents = function() {
  var numParents = 0;
  var todo = this;
  while ( todo = todo.parent ) { ++numParents; }
  return numParents;
};

Todo.prototype.update = function(val) {
  _(['title', 'owner']).each(function(key) {
    this[key] = val[key];
  }, this);

  this.created_at = val.created_at && moment.unix(val.created_at);
  this.done_at = val.done_at && moment.unix(val.done_at);
  this.due_at = val.due_at && moment.unix(val.due_at);

  this.children = [];
  if ( val.children ) {
    _(val.children).each(function(child_val, id) {
      var child = Todo(id, child_val, this);
      this.children.push(child);
    }, this);
  }
};

Todo.prototype.setDone = function(done) {
  if ( done ) {
    this.done_at = moment();
    this.ref.child('done_at').set(this.done_at.unix());
  }
  else {
    this.done_at = null;
    this.ref.child('done_at').remove();
  }
  return done;
};

Todo.prototype.toggle = function() {
  return this.setDone(!this.isDone());
};

Todo.prototype.toString = function() {
  return 'Todo(title: ' + this.title + ', done? ' + (this.isDone() ? this.done_at.fromNow() : 'no') + ')';
}

module.exports = Todo;
