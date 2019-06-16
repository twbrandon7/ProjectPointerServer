var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LXC' });
});

router.get('/control/:id', function(req, res, next) {
  res.render('control', { title: 'RMC', id: req.params.id });
});

module.exports = router;
