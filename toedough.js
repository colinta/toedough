var Firebase = require('firebase');
var URL = 'https://motion-firebase.firebaseio.com';
var connected_ref = new Firebase(URL).child('.info/connected');
var firebase = new Firebase(URL);
var toedough = firebase.child('toedough');

var online_ref = toedough.child('online');
var chat_ref   = toedough.child('chat');
var users_ref  = toedough.child('users');
var todos_ref  = toedough.child('todo');

var my_id = process.env.my_id || '0';

module.exports = {
  URL: URL,
  connected_ref: connected_ref,
  firebase: firebase,
  toedough: toedough,
  online_ref: online_ref,
  chat_ref: chat_ref,
  users_ref: users_ref,
  todos_ref: todos_ref,
  my_id: my_id
};
