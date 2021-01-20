'use strict';
const express = require('express');
const router = express.Router();
this.hbs = './form.hbs';

router.get('/', function(req, res, next) {
  // res.send({ message: 'Hello' });
  console.log('hello');
  res.render('form.hbs');
});

router.post('/', function(req, res, next) {
  // res.send({ message: 'Hello' });
  console.log('req.params', req.params);
  console.log('req.file', req.file);
  res.render('form.hbs');
});

module.exports = router;
