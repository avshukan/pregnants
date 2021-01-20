'use strict';
const express = require('express');
const router = express.Router();
const hbs = './process-file.hbs';

router.get('/', function(req, res, next) {
  // res.send({ message: 'Hello' });
  console.log('process-file get');
  res.render(hbs);
});

router.post('/', function(req, res, next) {
  // res.send({ message: 'Hello' });
  console.log('process-file post');
  console.log('req.params', req.params);
  console.log('req.file', req.file);
  console.log('req.files', req.files);
  console.log('req.body', req.body);
  res.render(hbs);
});

module.exports = router;
