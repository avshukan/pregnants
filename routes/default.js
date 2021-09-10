'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', defaultRender);

async function defaultRender(req, res, next) {
  const hbs = path.join('.', 'default.hbs');
  res.render(hbs);
}

module.exports = router;
