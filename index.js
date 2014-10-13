// issues:
// [ ] up/down/pageup/down don't scroll, but home/end DO.

Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

var blessed = require('blessed');
var _ = require('underscore');
var moment = require('moment');

var TodoList = require('./blessed_todo_list').TodoList;

var Todo = require('./models/todo');
var User = require('./models/user');

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

screen.append(blessed.text({
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
todo_list.append(blessed.text({ left: 2, content: ' Todo… ' }));
screen.append(todo_list);
todo_list.focus();

var activity_box = blessed.box({
  left: 21,
  right: 0,
  top: '50%',
  bottom: 4,
  fg: '#ffffff',
  bg: 'default',
  tags: true
});

var details_box = blessed.box({
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  border: {
    type: 'double',
    fg: '#ffffff',
    bg: 'default'
  },
  tags: true
});

var chat_box = blessed.box({
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  border: {
    type: 'double',
    fg: '#ffffff',
    bg: 'default'
  },
  tags: true
});

var chat_prompt = blessed.text({
  bottom: 1,
  height: 1,
  left: 1,
  width: 1,
  fg: '#fff',
  bg: '#000',
  content: '>'
});

var chat_input = blessed.textarea({
  bottom: 1,
  height: 1,
  left: 2,
  right: 2,
  fg: '#fff',
  bg: '#000',
  inputOnFocus: true
});
chat_box.append(chat_prompt);
chat_box.append(chat_input);

todo_list.key([screen.tabc], function(ch, key) {
  chat_input.focus();
});

chat_box.on('click', function(el, mouse) {
  chat_input.focus();
});

chat_input.key(['enter'], function(ch, key) {
  var text = chat_input.getValue().replace('\n', '');
  if ( text ) {
    chat_ref.push({ owner: my_id, text: text });
    chat_input.setValue('');
  }
});

chat_input.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

chat_input.key(['up'], function() {
  chat_log.scroll(-1);
  screen.render();
});
chat_input.key(['down'], function() {
  chat_log.scroll(1);
  screen.render();
});
chat_input.key(['pageup'], function() {
  chat_log.scroll(-(chat_log.height / 2 | 0) || -1);
  screen.render();
});
chat_input.key(['pagedown'], function() {
  chat_log.scroll(chat_log.height / 2 | 0 || 1);
  screen.render();
});
chat_input.key(['home'], function() {
  chat_log.scroll(-chat_log._clines.length);
  screen.render();
});
chat_input.key(['end'], function() {
  chat_log.scroll(chat_log._clines.length);
  screen.render();
});

var chat_log = blessed.scrollablebox({
  left: 1,
  top: 1,
  right: 1,
  bottom: 2,
  tags: true,
  mouse: true
});
chat_box.append(chat_log);

var details_text = blessed.text({
  left: 2,
  content: ' Details ',
  width: 9,
  height: 1,
  underline: true
});
var details_button = blessed.button({
  left: 2,
  content: ' Details ',
  width: 9,
  height: 1,
  hoverBg: 'red'
});

var chat_text = blessed.text({
  right: 2,
  content: ' Chat ',
  width: 6,
  height: 1,
  underline: true
});
var chat_button = blessed.button({
  right: 2,
  content: ' Chat ',
  width: 6,
  height: 1,
  hoverBg: 'red'
});

details_button.on('click', function() {
  activity_box.remove(chat_box);
  activity_box.append(details_box);
  todo_list.focus();
  screen.render();
});

chat_button.on('click', function() {
  activity_box.remove(details_box);
  activity_box.append(chat_box);
  chat_input.setValue();
  chat_input.focus();
  chat_input.readInput();
  screen.render();

  if ( chat_log.shouldScrollToBottom ) {
    chat_log.scrollToBottom();
    chat_log.shouldScrollToBottom = false;
  }
});

details_box.append(details_text);
details_box.append(chat_button);

chat_box.append(chat_text);
chat_box.append(details_button);

activity_box.append(details_box);
screen.append(activity_box);

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
login.append(blessed.text({ left: 2, content: ' Logging in… ' }));
screen.append(login);

var status_box = blessed.text({
  bottom: 0,
  height: 1,
  left: 0,
  width: '100%'
});
var status = blessed.text({ content: '---' });
status_box.append(status);
screen.append(status_box);

function set_status(text) {
  status.setText(text.toString().replace('\n', '\\n'));
  screen.render();
}

function toggle_login(visible) {
  if ( visible ) {
    screen.append(login);
  }
  else {
    screen.remove(login);
  }
  screen.render();
}

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();


var app = require('./toedough');
var URL           = app.URL;
var connected_ref = app.connected_ref;
var firebase      = app.firebase;
var toedough      = app.toedough;
var online_ref    = app.online_ref;
var chat_ref      = app.chat_ref;
var users_ref     = app.users_ref;
var todos_ref     = app.todos_ref;
var my_id         = app.my_id;

var my_presence_ref = online_ref.child(my_id)
my_presence_ref.onDisconnect().remove();

connected_ref.on('value', function(connected) {
  toggle_login(!connected.val());

  if ( connected.val() ) {
    my_presence_ref.set(true);
    set_status('Logged in at ' + new Date());
  }
  else {
    set_status('Offline');
  }
});

var online_users = [];
function update_user_list() {
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
var _todo_top_items;
function update_todo_list(todos) {
  todos = todos || _todo_top_items || [];
  _todo_top_items = todos;

  var selected_id = null;
  var selected_todo = null;

  if ( _todo_list_items && _todo_list_items.length > 0 ) {
    selected_todo = _todo_list_items[todo_list.selected];
    selected_id = selected_todo && selected_todo.id;
  }

  var open_todos = _(todos).chain()
    .map(function(todo) {
      if ( todo.isExpanded() ) {
        return [todo].concat(todo.children);
      }
      else {
        return [todo];
      }
    })
    .flatten()
    .value();
  _todo_list_items = open_todos;

  var selected_index = 0;
  _(open_todos).each(function(todo, idx) {
    if ( selected_id && selected_id == todo.id ) {
      selected_index = idx;
      return;
    }
  });

  todo_list.setItems(open_todos);
  todo_list.select(selected_index);
  screen.render();
};
setInterval(update_todo_list, moment.duration(15, 'seconds').asMilliseconds());

todo_list.on('select', function(__, idx) {
  if ( ! _todo_list_items ) return;

  var todo = _todo_list_items[idx];
  if ( todo.isExpandable() ) {
    todo.expand();
    update_todo_list();
  }
  else if ( todo ) {
    todo.toggle();
  }
});

function update_details() {
  var todo = _todo_list_items[todo_list.selected];
  details_box.setContent(
    '{center}{underline}' + todo.title + '{/underline}{/center}\n' +
    '\n' +
    'created: ' + (todo.created_at ? todo.created_at.fromNow() : 'unknown') + '\n',
    'by:      '
    );
  screen.render();
}
todo_list.on('change', update_details);

var get_user = function(user_id) {
  var user = User(user_id);
  if ( ! user.name ) {
    users_ref.child(user_id).once('value', function(user_snapshot) {
      user.update(user_snapshot.val());

      update_user_list();
      update_chat(false);
    });
  }

  return user;
};

online_ref.on('value', function(snapshot) {
  var user_ids = snapshot.val();
  online_users = [];

  _(user_ids).each(function(is_online, user_id) {
    if ( !is_online )  return true;

    var user = get_user(user_id);
    online_users.push(user);
  });

  update_user_list();
});


var todos = [];

function todo_from_snapshot(todo_snapshot) {
  return Todo(todo_snapshot.name(), todo_snapshot.val());
}

todos_ref.on('child_removed', function(todo_snapshot){
  todos = _(todos).reject(function(todo) { todo.id == todo_snapshot.name(); });
  update_todo_list(todos);
});

todos_ref.on('child_changed', function(todo_snapshot){
  var todo = todo_from_snapshot(todo_snapshot);
  update_todo_list();
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

var chats = [];
chat_ref.on('child_added', function(chat_snapshot){
  chats.push(chat_snapshot.val());
  update_chat();
});

function update_chat(scroll_to_bottom) {
  scroll_to_bottom = scroll_to_bottom !== false;

  chat_log.removeAll();
  var y = 0;
  var chat_content = '';
  chats.forEach(function(chat) {
    if ( chat_content ) {
      chat_content += "\n";
    }
    var owner = get_user(chat.owner);
    var username = owner && owner.name;
    username = (username || '');
    username += ':';

    var username_len = 10;
    while ( username.length < username_len ) {
      username += ' ';
    }

    var chat_text = chat.text.replace(/(@\w+)\b/g, '{bold}$1{/bold}');
    chat_content += '{bold}' + username.replace(':', ':{/bold}') + chat_text + '{/}';
  });
  chat_log.setContent(chat_content);
  screen.render();

  if ( scroll_to_bottom ) {
    if ( chat_log.detached ) {
      chat_log.shouldScrollToBottom = true;
    }
    else {
      chat_log.scrollToBottom();
      screen.render();
    }
  }
};
update_chat = _(update_chat).throttle(250);
