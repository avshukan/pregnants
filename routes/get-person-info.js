'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const getListApi = require('../api/get-list-api.js');

router.get('/', getPersonInfo);
router.get('/api', getPersonInfoApi);

async function getPersonInfo(req, res, next) {
  const hbs = path.join('.', 'get-person-info.hbs');
  res.render(hbs);
}

async function getPersonInfoApi(req, res, next) {
  const {query} = req;
  const info = await getListApi(query);
  if (info.error)
    console.log('Что-то надо здесь прописать');
  res.send(info);
}

module.exports = router;
