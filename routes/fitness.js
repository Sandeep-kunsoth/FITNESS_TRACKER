var express = require('express');
var router = express.Router();

// Fitness home page
router.get('/', function(req, res) {
  res.render('fitness', { title: 'Fitness Page' });
});

module.exports = router;
