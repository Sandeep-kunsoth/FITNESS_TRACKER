var express = require('express');
var router = express.Router();

// Home page
router.get('/', function(req, res) {
  res.render('index', { title: 'Fitness Tracker' });
});

// Goals page
router.get('/goals', function(req, res) {
  res.render('goals', { title: 'My Fitness Goals' });
});

// Analytics page
router.get('/analytics', function(req, res) {
  res.render('analytics', { title: 'Analytics Dashboard' });
});

// Share page
router.get('/share', function(req, res) {
  res.render('share', { title: 'Share Progress' });
});

module.exports = router;
