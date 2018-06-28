var sqlite3 = require('sqlite3').verbose();
var sqlite = new sqlite3.Database('data/rdsdb.db');
var dbm = require('./db_module.js');

module.exports = dbm.db_module(sqlite);
