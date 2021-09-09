'use strict';
const sqlScript = 'get-pregnants-list.sql';
const oracledb = require('oracledb');
const getQuery = require('../utils/get-sql-query');

const {
  ORACLE_DB_HOST,
  ORACLE_DB_PORT,
  ORACLE_DB_NAME,
  ORACLE_DB_USER,
  ORACLE_DB_PASS,
} = process.env;

async function getListApi({r = '', snils = '', f = '', i = '', o = '', dr = '', limit = ''}) {
  let result = {text: 'api works!'};
  let connection;
  try {
    connection = await oracledb.getConnection({
      connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
      user: ORACLE_DB_USER,
      password: ORACLE_DB_PASS,
    });
    const selectQuery = await getQuery(sqlScript);
    const binds = {
      r,
      snils: snils.replace(/\D/g, ''),
      f,
      i,
      o,
      dr,
      limit,
    };
    console.log('binds', binds);
    const selectResult = await connection.execute(selectQuery, binds);
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

module.exports = getListApi;
