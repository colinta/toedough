var blessed = require('blessed');
var moment = require('moment');

Node = blessed.Node;
Box = blessed.Box;
Text = blessed.Text;
List = blessed.List;


function TodoItem(todo, options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new TodoItem(todo, options);
  }

  options = options || {};

  this.todo = todo;

  var done_content;
  var indent = '';
  var numParents = todo.numParents();
  for (; numParents; --numParents ) {
    indent += '  ';
  }

  if ( todo.hasChildren() ) {
    if ( todo.isDone() ) {
      done_content = '{bold}(✓){/bold}';
    }
    else if ( todo.isExpanded() ) {
      done_content = '{bold}( ){/bold}';
    }
    else {
      done_content = '{bold}(+){/bold}';
    }
  }
  else if ( todo.isDone() ) {
    done_content = '{bold}[✓]{/bold}';
  }
  else {
    done_content = '{bold}[ ]{/bold}';
  }

  var done_at_content = '';
  if ( todo.done_at ) {
    done_at_content += '{underline}Done: ' + todo.done_at.fromNow() + '{/underline}';
  }
  else if ( todo.due_at ) {
    var now = moment();
    var format;
    if ( todo.due_at.isBefore(now) ) {
      done_at_content += '{bold}Overdue!{/bold} ';
    }
    done_at_content += '{underline}Due: ' + todo.due_at.fromNow() + '{/underline}';
  }
  options.content = indent + '    ' + todo.title;
  Box.call(this, options);

  this.checkbox = new Box({
    screen: this.screen,
    content: done_content,
    align: 'left',
    top: 0,
    left: indent.length,
    width: 4,
    transparent: true,
    // fg: function() { return self.style.fg(); },
    // bg: function() { return self.style.bg(); },
    tags: this.parseTags,
    height: 1,
    hoverEffects: this.mouse ? this.style.item.hover : null,
    focusEffects: this.mouse ? this.style.item.focus : null,
    autoFocus: false
  });
  this.append(this.checkbox);

  this.done_at = new Box({
    screen: this.screen,
    content: done_at_content,
    align: 'right',
    top: 0,
    right: 0,
    width: blessed.toText(done_at_content).length + 1,
    transparent: true,
    tags: this.parseTags,
    height: 1,
    hoverEffects: this.mouse ? this.style.item.hover : null,
    focusEffects: this.mouse ? this.style.item.focus : null,
    autoFocus: false
  });
  this.append(this.done_at);
};

TodoItem.prototype.__proto__ = Box.prototype;


function TodoList(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new TodoList(options);
  }

  options = options || {};
  List.call(this, options);
};

TodoList.prototype.__proto__ = List.prototype;

TodoList.prototype.createListItem = function(todo) {
  var options = {
    screen: this.screen,
    align: this.align || 'left',
    top: this._calcNextTop(),
    left: this.ileft + 1,
    right: this.iright + 1,
    tags: this.parseTags,
    height: 1,
    hoverEffects: this.mouse ? this.style.item.hover : null,
    focusEffects: this.mouse ? this.style.item.focus : null,
    autoFocus: false
  };

  if (this.screen.autoPadding) {
    options.top = this.items.length;
    options.left = 1;
    options.right = 1;
  }

  var node = new TodoItem(todo, options);

  return node;
};

module.exports.TodoList = TodoList;
module.exports.TodoItem = TodoItem;
