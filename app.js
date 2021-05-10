var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var index = require('./routes/index');
var login = require('./routes/login');
var users = require('./routes/users');
var subject = require('./routes/subject');
var bugreport = require('./routes/bugreport');
var blockrequest = require('./routes/blockrequest');
var requestedsubject = require('./routes/requestedsubject');
var expressValidator = require('express-validator');
var methodOverride = require('method-override');
const http = require('http');
const pool = require('./db_connection/connection.js').pool;
const createWSS = require('./restapi/websocket.js').createWSS;

var connection  = require('express-myconnection');
var mysql = require('mysql');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(session({secret:"secretpass123456"}));
app.use(flash());
app.use(expressValidator());
app.use(methodOverride(function(req, res){
 if (req.body && typeof req.body == 'object' && '_method' in req.body)
  {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*------------------------------------------
    connection peer, register as middleware
    type koneksi : single,pool and request
-------------------------------------------*/
app.use(
    connection(mysql,{
        host: 'localhost',
        user: 'dbuser', // your mysql user
        password : '1qaz2wsx', // your mysql password
        port : 3306, //port mysql
        database:'drawwithfriend' // your database name
    },'pool') //or single
);

const port = process.env.PORT || 8080;

app.use('/rest', index);
app.use('/login', login);
app.use('/subject', subject);
app.use('/bugreport', bugreport);
app.use('/blockrequest', blockrequest);
app.use('/requestedsubject', requestedsubject);
app.use('/user', users);
app.use('/admin', login);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const httpServer = http.createServer(app);

createWSS(httpServer);

httpServer.listen(port, () => {
  console.log(`Connected to port ${port}`);
});

module.exports = app;
