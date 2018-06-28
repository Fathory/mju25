var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('main', { title: 'Express' });
});

router.get('/blank', function(req, res, next) {
  res.render('blank/blank', { title: 'Express' });
});
module.exports = router;
