# issues:
# [ ] up/down/pageup/down don't scroll, but home/end DO.

Array.prototype.insert = (index, item)->
  this.splice(index, 0, item)

blessed = require('blessed')
_ = require('underscore')
moment = require('moment')
notifier = require('node-notifier')

TodoList = require('./blessed_todo_list').TodoList

Todo = require('./models/todo')
User = require('./models/user')

# Create a screen object.
screen = blessed.screen()

user_list = blessed.list({
  width: 20
  bottom: 4
  top: 1
  left: 0
  align: 'left'
  fg: 'blue'
  bg: 'black'
  selectedBg: 'blue'

  # Allow mouse support
  mouse: false

  # Allow key support (arrow keys + enter)
  keys: false

  # Use vi built-in keys
  vi: false
})
screen.append(user_list)

screen.append(blessed.text({
  bg: 'black'
  content: ' ————— Online ————— '
}))

todo_list = new TodoList({
  left: 21
  right: 0
  top: 0
  height: '50%'
  fg: '#ffffff'
  bg: 'default'
  border: {
    type: 'line'
    fg: '#ffffff'
    bg: 'default'
  }
  tags: true
  selectedBg: 'blue'

  # Allow mouse support
  mouse: true

  # Allow key support (arrow keys + enter)
  keys: true
})
todo_list.append(blessed.text({ left: 2, content: ' Todo… ' }))
screen.append(todo_list)
todo_list.focus()

activity_box = blessed.box({
  left: 21
  right: 0
  top: '50%'
  bottom: 4
  fg: '#ffffff'
  bg: 'default'
  tags: true
})

details_box = blessed.box({
  left: 0
  top: 0
  right: 0
  bottom: 0
  border: {
    type: 'double'
    fg: '#ffffff'
    bg: 'default'
  }
  tags: true
})

chat_box = blessed.box({
  left: 0
  top: 0
  right: 0
  bottom: 0
  border: {
    type: 'double'
    fg: '#ffffff'
    bg: 'default'
  }
  tags: true
})

chat_prompt = blessed.text({
  bottom: 1
  height: 1
  left: 1
  width: 1
  fg: '#fff'
  bg: '#000'
  content: '>'
})

chat_input = blessed.textarea({
  bottom: 1
  height: 1
  left: 2
  right: 2
  fg: '#fff'
  bg: '#000'
  inputOnFocus: true
})
chat_box.append(chat_prompt)
chat_box.append(chat_input)

todo_list.key([screen.tabc], (ch, key)->
  chat_input.focus()
)

chat_box.on('click', (el, mouse)->
  chat_input.focus()
)

chat_input.key(['C-u'], (ch, key)->
  if screen.program.toggleMouse()
    set_status('mouse enabled')
  else
    set_status('mouse disabled')
  return false
)

chat_input.key(['enter'], (ch, key)->
  text = chat_input.getValue().replace('\n', '')
  if text
    chat_ref.push({ owner: my_id, text: text })
    chat_input.setValue('')
)

chat_input.key(['C-c'], (ch, key)->
  return process.exit(0)
)

chat_input.key(['up'], ()->
  chat_log.scroll(-1)
  screen.render()
)
chat_input.key(['down'], ()->
  chat_log.scroll(1)
  screen.render()
)
chat_input.key(['pageup'], ()->
  chat_log.scroll(-(chat_log.height / 2 | 0) || -1)
  screen.render()
)
chat_input.key(['pagedown'], ()->
  chat_log.scroll(chat_log.height / 2 | 0 || 1)
  screen.render()
)
chat_input.key(['home'], ()->
  chat_log.scroll(-chat_log._clines.length)
  screen.render()
)
chat_input.key(['end'], ()->
  chat_log.scroll(chat_log._clines.length)
  screen.render()
)

chat_log = blessed.scrollablebox(
  left: 1
  top: 1
  right: 1
  bottom: 2
  tags: true
  mouse: true
)
chat_box.append(chat_log)

details_text = blessed.text({
  left: 2
  content: ' Details '
  width: 9
  height: 1
  underline: true
})
details_button = blessed.button({
  left: 2
  content: ' Details '
  width: 9
  height: 1
  hoverBg: 'red'
})

chat_text = blessed.text({
  right: 2
  content: ' Chat '
  width: 6
  height: 1
  underline: true
})
chat_button = blessed.button({
  right: 2
  content: ' Chat '
  width: 6
  height: 1
  hoverBg: 'red'
})

details_button.on('click', ()->
  current_activity = 'details'
  notifications_enabled = false
  activity_box.remove(chat_box)
  activity_box.append(details_box)
  todo_list.focus()
  screen.render()
)

chat_button.on('click', ()->
  current_activity = 'chat'
  notifications_enabled = true
  activity_box.remove(details_box)
  activity_box.append(chat_box)
  chat_input.setValue()
  chat_input.focus()
  chat_input.readInput()
  screen.render()

  if chat_log.shouldScrollToBottom
    chat_log.scrollToBottom()
    chat_log.shouldScrollToBottom = false
)


current_activity = 'details'
details_box.append(details_text)
details_box.append(chat_button)

chat_box.append(chat_text)
chat_box.append(details_button)

activity_box.append(details_box)
screen.append(activity_box)

login = blessed.box({
  fg: '#ffffff'
  bg: '#000000'
  border: {
    type: 'line'
    fg: '#ffffff'
    bg: '#000000'
  }
  tags: true
  content: ''
  width: 50
  height: 5
  top: 'center'
  left: 'center'
})
login.append(blessed.text({ left: 2, content: ' Logging in… ' }))
screen.append(login)

status_box = blessed.text({
  bottom: 0
  height: 1
  left: 0
  width: '100%'
})
status = blessed.text({ content: '---' })
status_box.append(status)
screen.append(status_box)

_status_text = []
status_timer = null
_update_status = ()->
  text = _status_text.shift()
  if text
    status.setText(text)
    screen.render()
    status_timer = setTimeout(_update_status, 3000)
  else
    status.setText('')
    screen.render()
    status_timer = null

set_status = (text)->
  text = text.toString().replace('\n', '\\n')

  _status_text.push(text)
  if ! status_timer
    _update_status()

toggle_login = (visible)->
  if visible
    screen.append(login)
  else
    screen.remove(login)
  screen.render()

screen.key(['C-u'], (ch, key)->
  if screen.program.toggleMouse()
    set_status('mouse enabled')
  else
    set_status('mouse disabled')
)
# Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], (ch, key)->
  return process.exit(0)
)

screen.render()


app = require('./toedough')
URL           = app.URL
connected_ref = app.connected_ref
firebase      = app.firebase
toedough      = app.toedough
online_ref    = app.online_ref
chat_ref      = app.chat_ref
users_ref     = app.users_ref
todos_ref     = app.todos_ref
my_id         = app.my_id

my_presence_ref = online_ref.child(my_id)
my_presence_ref.onDisconnect().remove()

connected_ref.on('value', (connected)->
  toggle_login(!connected.val())

  if connected.val()
    my_presence_ref.set(true)
    set_status('Logged in at ' + new Date())
  else
    set_status('Offline')
)

online_users = []
update_user_list = ()->
  selected_index = 0
  items = _(online_users).map((user, idx)->
    if user.id == my_id
      selected_index = idx
    return user.name || ''
  )
  user_list.setItems(items)
  user_list.select(selected_index)
  screen.render()

_todo_list_items = null
_todo_top_items = null
update_todo_list = (todos)->
  todos = todos || _todo_top_items || []
  _todo_top_items = todos

  selected_id = null
  selected_todo = null

  if _todo_list_items && _todo_list_items.length > 0
    selected_todo = _todo_list_items[todo_list.selected]
    selected_id = selected_todo && selected_todo.id

  open_todos = _(todos).chain()
    .map((todo)->
      if todo.isExpanded()
        return [todo].concat(todo.children)
      else
        return [todo]
    )
    .flatten()
    .value()
  _todo_list_items = open_todos

  selected_index = 0
  _(open_todos).each((todo, idx)->
    if selected_id && selected_id == todo.id
      selected_index = idx
      return
  )

  todo_list.setItems(open_todos)
  todo_list.select(selected_index)
  screen.render()

setInterval(update_todo_list, moment.duration(15, 'seconds').asMilliseconds())

todo_list.on('select', (__, idx)->
  return if not _todo_list_items

  todo = _todo_list_items[idx]
  if todo.isExpandable()
    todo.expand()
    update_todo_list()
  else if  todo
    todo.toggle()
)

update_details = ()->
  todo = _todo_list_items[todo_list.selected]
  if todo.created_at
    created_text = todo.created_at.fromNow()
  else
    created_text = 'unknown'
  details_box.setContent(
    "{center}{underline}#{todo.title}{/underline}{/center}\n" +
    '\n' +
    "created: #{created_text}\n" +
    'by:      '
    )
  screen.render()

todo_list.on('change', update_details)

get_user = (user_id)->
  user = User(user_id)
  if ! user.name
    users_ref.child(user_id).once('value', (user_snapshot)->
      user.update(user_snapshot.val())

      update_user_list()
      update_chat(false)
    )

  return user

online_ref.on('value', (snapshot)->
  user_ids = snapshot.val()
  online_users = []

  _(user_ids).each((is_online, user_id)->
    return true if !is_online

    user = get_user(user_id)
    online_users.push(user)
  )

  update_user_list()
)


todos = []

todo_from_snapshot = (todo_snapshot)->
  return Todo(todo_snapshot.name(), todo_snapshot.val())

todos_ref.on('child_removed', (todo_snapshot)->
  todos = _(todos).reject((todo)-> todo.id == todo_snapshot.name())
  update_todo_list(todos)
)

todos_ref.on('child_changed', (todo_snapshot)->
  todo = todo_from_snapshot(todo_snapshot)
  update_todo_list()
)

todos_ref.on('child_moved', (todo_snapshot, prev_child_name)->
  todos = _(todos).reject((todo)-> todo.id == todo_snapshot.name() )
  if prev_child_name
    insert_index = todos.length
    _(todos).each((todo, idx)->
      if todo.id == prev_child_name
        insert_index = idx
        return false
    )
    todo = todo_from_snapshot(todo_snapshot)
    todos.insert(insert_index, todo)
  else
    todos.unshift(todo)
  update_todo_list(todos)
)

todos_ref.on('child_added', (todo_snapshot)->
  todo = todo_from_snapshot(todo_snapshot)
  todos.push(todo)
  update_todo_list(todos)
)

chats = []
notifications_enabled = false
enable_notifications = _.throttle((()->
  notifications_enabled = true
), 250, {leading: false})

chat_ref.on('child_added', (chat_snapshot)->
  chat = chat_snapshot.val()
  chats.push(chat)
  update_chat()
  enable_notifications()

  if notifications_enabled && chat.owner != my_id
    owner = User(chat.owner)
    title = if owner
      owner.name
    else
      'Someone'
    title += ' said:'
    message = chat.text
    if current_activity != 'chat'
      set_status(title + ' ' + message)
    notifier.notify({
      'title': title
      'message': message
    })
)

update_chat = (scroll_to_bottom)->
  scroll_to_bottom = scroll_to_bottom != false

  chat_log.removeAll()
  y = 0
  chat_content = ''
  chats.forEach((chat)->
    if chat_content
      chat_content += "\n"
    owner = get_user(chat.owner)
    username = owner && owner.name
    username = (username || '')
    username += ':'

    username_len = 10
    while ( username.length < username_len )
      username += ' '

    chat_text = chat.text.replace(/(@\w+)\b/g, '{bold}$1{/bold}')
    chat_content += '{bold}' + username.replace(':', ':{/bold}') + chat_text + '{/}'
  )
  chat_log.setContent(chat_content)
  screen.render()

  if scroll_to_bottom
    if chat_log.detached
      chat_log.shouldScrollToBottom = true
    else
      chat_log.scrollToBottom()
      screen.render()

update_chat = _(update_chat).throttle(250)
