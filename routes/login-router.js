'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', loginRender);

async function loginRender(req, res, next) {
  const hbs = path.join('.', 'login.hbs');
  res.cookie('name', 'Jack', {
    maxAge: 5000,
    // expires works the same as the maxAge
    expires: new Date('01 12 2021'),
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });
  res.render(hbs);
}

module.exports = router;
