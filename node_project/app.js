var express = require('express');
var path = require('path');

var app = express();

var index = require('./routes/index.js');

console.log('express is started by SC.');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

console.log(__dirname);

app.use('/js', [
    express.static(__dirname + '/views/common/js'),
    express.static(__dirname + '/views/main/js')
  ]
  );
app.use('/', index);

module.exports = app;