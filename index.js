Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

var blessed = require('blessed');
var _ = require('underscore');
var moment = require('moment');

var TodoList = require('./blessed_todo_list').TodoList;

var Todo = require('./models/todo');

// Create a screen object.
var screen = blessed.screen();

var user_list = blessed.list({
  width: 20,
  bottom: 4,
  top: 1,
  left: 0,
  align: 'left',
  fg: 'blue',
  bg: 'black',
  selectedBg: 'blue',

  // Allow mouse support
  mouse: false,

  // Allow key support (arrow keys + enter)
  keys: false,

  // Use vi built-in keys
  vi: false
});
screen.append(user_list);

screen.append(new blessed.Text({
  bg: 'black',
  content: ' ————— Online ————— '
}));

var todo_list = new TodoList({
  left: 21,
  right: 0,
  top: 0,
  height: '50%',
  fg: '#ffffff',
  bg: 'default',
  border: {
    type: 'line',
    fg: '#ffffff',
    bg: 'default'
  },
  tags: true,
  selectedBg: 'blue',

  // Allow mouse support
  mouse: true,

  // Allow key support (arrow keys + enter)
  keys: true
});
todo_list.append(new blessed.Text({ left: 2, content: ' Todo… ' }));
screen.append(todo_list);
todo_list.focus();

var details_box = blessed.box({
  left: 21,
  right: 0,
  top: '50%',
  bottom: 4,
  fg: '#ffffff',
  bg: 'default',
  border: {
    type: 'line',
    fg: '#ffffff',
    bg: 'default'
  },
  tags: true
});
details_box.append(new blessed.Text({ left: 2, content: ' Details ' }));
screen.append(details_box);

var login = blessed.box({
  fg: '#ffffff',
  bg: '#000000',
  border: {
    type: 'line',
    fg: '#ffffff',
    bg: '#000000'
  },
  tags: true,
  content: '',
  width: 50,
  height: 5,
  top: 'center',
  left: 'center'
});
login.append(new blessed.Text({ left: 2, content: ' Logging in… ' }));
screen.append(login);

var status_box = blessed.text({
  bottom: 0,
  height: 1,
  left: 0,
  width: '100%'
});
var status = new blessed.Text({ content: '---' });
status_box.append(status);
screen.append(status_box);

function set_status(text) {
  status.setText(text.toString());
}

function toggle_login(visible) {
  if ( visible ) {
    screen.append(login);
  }
  else {
    screen.remove(login);
  }
}

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();


var app = require('./toedough');
URL           = app.URL;
connected_ref = app.connected_ref;
firebase      = app.firebase;
toedough      = app.toedough;
online_ref    = app.online_ref;
users_ref     = app.users_ref;
todos_ref     = app.todos_ref;

var my_id = process.env.my_id || '0';
var users = {};

var my_presence_ref = online_ref.child(my_id)
my_presence_ref.onDisconnect().remove();

connected_ref.on('value', function(connected) {
  toggle_login(!connected.val());

  if ( connected.val() ) {
    set_status('Logged in at ' + new Date());
    my_presence_ref.set(true);
  }
  else {
    set_status('Offline');
  }
});

function update_user_list(online_users) {
  var selected_index = 0;
  var items = _(online_users).map(function(user, idx) {
    if ( user.id == my_id ) {
      selected_index = idx;
    }
    return user.name || '';
  });
  user_list.setItems(items);
  user_list.select(selected_index);
  screen.render();
}

var _todo_list_items;
function update_todo_list(todos) {
  todos = todos || _todo_list_items || [];
  var selected_id = null;
  var selected_todo = null;

  if ( _todo_list_items && _todo_list_items.length > 0 ) {
    selected_todo = _todo_list_items[todo_list.selected];
    selected_id = selected_todo && selected_todo.id;
  }
  _todo_list_items = todos;

  var selected_index = 0;
  _(todos).each(function(todo, idx) {
    if ( selected_id && selected_id == todo.id ) {
      selected_index = idx;
      return;
    }
  });

  todo_list.setItems(todos);
  todo_list.select(selected_index);
  screen.render();
};
setInterval(update_todo_list, moment.duration(15, 'seconds').asMilliseconds());

todo_list.on('select', function(__, idx) {
  var todo = _todo_list_items[idx];
  if ( todo ) {
    todo.toggle();
  }
});

todo_list.on('change', function(__, idx) {
  var todo = _todo_list_items[idx];
  details_box.setContent(
    '{center}{underline}' + todo.title + '{/underline}{/center}\n' +
    '\n' +
    'created: ' + (todo.created_at ? todo.created_at.fromNow() : 'unknown')
    );
});

online_ref.on('value', function(snapshot) {
  var user_ids = snapshot.val();
  var online_users = [];

  _(user_ids).each(function(is_online, idx) {
    if ( !is_online )  return true;

    if ( !users[idx] ) {
      users[idx] = {};
      users_ref.child(idx).once('value', function(user_snapshot) {
        users[idx].id = idx;
        users[idx].name = user_snapshot.val().name;
        update_user_list(online_users);
      });
    }
    online_users.push(users[idx]);
  });

  update_user_list(online_users);
});


var todos = [];

function todo_from_snapshot(todo_snapshot) {
  return new Todo(todo_snapshot.name(), todo_snapshot.val());
}

todos_ref.on('child_removed', function(todo_snapshot){
  todos = _(todos).reject(function(todo) { todo.id == todo_snapshot.name(); });
  update_todo_list(todos);
});

todos_ref.on('child_changed', function(todo_snapshot){
  _(todos).each(function(todo, idx) {
    if ( todo.id == todo_snapshot.name() ) {
      todos[idx] = todo_from_snapshot(todo_snapshot);
    }
  });
  update_todo_list(todos);
});

todos_ref.on('child_moved', function(todo_snapshot, prev_child_name){
  todos = _(todos).reject(function(todo) { todo.id == todo_snapshot.name(); });
  if ( prev_child_name ){
    var insert_index = todos.length;
    _(todos).each(function(todo, idx) {
      if ( todo.id == prev_child_name ) {
        insert_index = idx;
        return false;
      }
    });
    var todo = todo_from_snapshot(todo_snapshot);
    todos.insert(insert_index, todo);
  }
  else {
    todos.unshift(todo);
  }
  update_todo_list(todos);
});

todos_ref.on('child_added', function(todo_snapshot){
  var todo = todo_from_snapshot(todo_snapshot);
  todos.push(todo);
  update_todo_list(todos);
});
