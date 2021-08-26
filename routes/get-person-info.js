'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const oracledb = require('oracledb');
const getQuery = require('../utils/get-sql-query');

const {
  ORACLE_DB_HOST,
  ORACLE_DB_PORT,
  ORACLE_DB_NAME,
  ORACLE_DB_USER,
  ORACLE_DB_PASS,
} = process.env;

router.get('/', getPersonInfo);
router.get('/api', getPersonInfoApi);

async function getPersonInfo(req, res, next) {
  const hbs = path.join('.', 'get-person-info.hbs');
  res.render(hbs);
}

async function getPersonInfoApi(req, res, next) {
  const {query} = req;
  const info = await getPersonInfoByParams(query);
  res.send(info);
}

async function getPersonInfoByParams({snils = 0, f = '', i = '', o = '', dr = ''}) {
  let result = {text: 'api works!'};
  let connection;
  try {
    connection = await oracledb.getConnection({
      connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
      user: ORACLE_DB_USER,
      password: ORACLE_DB_PASS,
    });
    const selectQuery = await getQuery('get-person-info.sql');
    // const binds = [{snils: 1, f: ''}];
    // const binds = {snils: 18245274375}; // ok
    // const binds = [18245274375, 'Абабкова']; // ok
    // const binds = {snils: 18245274375, f: 'Абабкова'};
    // const binds = {snils: 0, f: 'Абабкова'};
    // const binds = {snils: 18245274375, f: '', i: '', o: ''};
    // const binds = {snils: 0, f: '', i: 'Влада', o: 'Владимировна'};
    const binds = {snils, f, i, o};
    // const binds = {snils: 18245274375, f: 'Абабкова'};
    const selectResult = await connection.execute(selectQuery, binds);
    // const selectResult = await connection.execute(selectQuery, [worksheet.name]);
    console.log('selectResult', selectResult);
    result = selectResult.rows;
    return result;
  } catch (err) {
    console.error('catch', err);
    console.log('File loader error!');
    result = {error: 'Ошибка выполнения запроса'};
  } finally {
    console.log('result', result);
    if (connection) {
      try {
        await connection.close();
        return result;
      } catch (err) {
        console.error('finally', err);
        return {error: 'Ошибка закрытия соединения БД'};
      }
    }
  }
}

module.exports = router;
