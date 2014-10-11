var Firebase = require('firebase');
var URL = 'https://motion-firebase.firebaseio.com';
var connected_ref = new Firebase(URL).child('.info/connected');
var firebase = new Firebase(URL);
var toedough = firebase.child('toedough');

var online_ref = toedough.child('online');
var users_ref = toedough.child('users');
var todos_ref = toedough.child('todo');

module.exports = {
  URL: URL,
  connected_ref: connected_ref,
  firebase: firebase,
  toedough: toedough,
  online_ref: online_ref,
  users_ref: users_ref,
  todos_ref: todos_ref
};
