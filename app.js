'use strict';
require('dotenv').config();
require('http-errors');
require('hbs');
const path = require('path');
const multer = require('multer');
const expressHbs = require('express-handlebars');
const express = require('express');

const dest = path.join(__dirname, 'uploads');
const multerUploader = multer({dest});

const app = express();

// app.use(logger(':remote-addr - :remote-user  [:date[iso]]  :method  :status
// :res[content-length]  HTTP/:http-version  :url  :referrer'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(corsHeadersService);

const {
  indexRouter,
  pregnantsInfoRouter,
  processFileRouter,
} = require('./routes');

app.use('/', indexRouter);
app.use('/info', pregnantsInfoRouter);
app.use('/process-file', multerUploader.single('filedata'), processFileRouter);

// app.use(function(req, res, next) {
//   next(createError(404));
// });

// app.use(function(err, req, res, next) {
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//   res.status(err.status || 500);
//   res.send('error');
// });

app.engine('hbs', expressHbs({
  layoutsDir: 'views/layouts',
  defaultLayout: 'layout',
  extname: 'hbs',
}));
app.set('view engine', 'hbs');

module.exports = app;
