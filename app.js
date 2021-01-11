'use strict';
const createError = require('http-errors');
const express = require('express');
const indexRouter = require('./routes/index');
require('dotenv').config();


const app = express();

// app.use(logger(':remote-addr - :remote-user  [:date[iso]]  :method  :status
// :res[content-length]  HTTP/:http-version  :url  :referrer'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(corsHeadersService);
// app.use(mongoConnectorService);

const getPregnantsInfoRouter = require('./routes/pregnants-info');

app.use('/', indexRouter);
app.use('/info', getPregnantsInfoRouter);

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
