const session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql');
var options = {
  host: 'localhost',
  user: 'dbuser',
  password: '1qaz2wsx',
  database: 'drawwithfriend'
}
const pool = mysql.createPool(options);
exports.pool = pool;
exports.sessionStore = new MySQLStore({}, pool);
