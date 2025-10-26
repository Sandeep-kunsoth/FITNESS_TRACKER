var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Connect to database
connectDB();

var indexRouter = require('./routes/index');
var fitnessRouter = require('./routes/fitness');
var authRouter = require('./routes/auth');
var workoutRouter = require('./routes/workouts');
var mealRouter = require('./routes/meals');
var sleepRouter = require('./routes/sleep');
var progressRouter = require('./routes/progress');
var dashboardRouter = require('./routes/dashboard');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // or pug/handlebars (default is jade/pug)

// middlewares
app.use(cors());
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', indexRouter);
app.use('/fitness', fitnessRouter);
app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/meals', mealRouter);
app.use('/api/sleep', sleepRouter);
app.use('/api/progress', progressRouter);
app.use('/api/dashboard', dashboardRouter);

// error handling
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;
