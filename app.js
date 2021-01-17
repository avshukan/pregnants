'use strict';
require('dotenv').config();
const path = require('path');
const hbs = require('hbs');
const createError = require('http-errors');
const express = require('express');


const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// app.use(logger(':remote-addr - :remote-user  [:date[iso]]  :method  :status
// :res[content-length]  HTTP/:http-version  :url  :referrer'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(corsHeadersService);
// app.use(mongoConnectorService);

const {
  indexRouter,
  pregnantsInfoRouter,
} = require('./routes');

app.use('/', indexRouter);
app.use('/info', pregnantsInfoRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
