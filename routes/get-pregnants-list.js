'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const oracledb = require('oracledb');
const exceljs = require('exceljs');


router.get('/all/json', async function(req, res, next) {
  await getJson('get-pregnants-list-all.sql', jsonHandler(res));
});

router.get('/all/xlsx', async function(req, res, next) {
  await getJson('get-pregnants-list-all.sql', xlsxHandler(res));
});

router.get('/last/json', async function(req, res, next) {
  await getJson('get-pregnants-list-last.sql', jsonHandler(res));
});

router.get('/last/xlsx', async function(req, res, next) {
  await getJson('get-pregnants-list-last.sql', xlsxHandler(res));
});

router.get('/part/json', async function(req, res, next) {
  await getJson('get-pregnants-list-part.sql', jsonHandler(res));
});

router.get('/part/xlsx', async function(req, res, next) {
  await getJson('get-pregnants-list-part.sql', xlsxHandler(res));
});


const getJson = async function(filename, handler) {
  const {
    ORACLE_DB_HOST,
    ORACLE_DB_PORT,
    ORACLE_DB_NAME,
    ORACLE_DB_USER,
    ORACLE_DB_PASS,
  } = process.env;

  const sqlFile = path.join(__dirname, '..', 'sql', filename);
  const sqlQuery = await fsPromises.readFile(sqlFile, 'utf8');
  try {
    oracledb
      .getConnection({
        connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
        user: ORACLE_DB_USER,
        password: ORACLE_DB_PASS,
      })
      .then((connection) => {
        connection
          .execute(sqlQuery)
          .then(async(result) => {
            await handler(result);
          })
          .catch((err) => {
            console.error('Can\'t execute!');
            throw err;
          });
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    console.error('Whoops!');
    console.error(err);
    process.exit(1);
  }
};


const jsonHandler = (respond) => async(data) => {
  respond.json(data);
};

const xlsxHandler = (respond) => async(data) => {
  const columns = [
    '№',
    'Фамилия беременной',
    'Имя беременной',
    'Отчество беременной',
    'ДР беременной',
    'СНИЛС',
    'Факт постановки на учёт на ранних сроках',
    'Cрок в днях на момент заведения карты',
    'Cрок в неделях на момент заведения карты',
    'Дата открытия карты беременной',
    'Дата закрытия карты беременной',
    'Дата начала срока',
    'Дата окончания срока',
    'Плановая дата окончания срока',
    'Причина закрытия индивидуальной карты',
    'Исход беременности',
    'ЛПУ',
    'Неделя посещения',
  ];
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('All Last Preganancies');
  // worksheet.getColumn(6).width = 15;
  // worksheet.getRow(1).getCell(6).value = 'DATE FROM';
  const header = worksheet.getRow(1);
  columns.forEach((item, index) => {
    header.getCell(index + 1).value = item;
  });
  data.rows.forEach((row, row_index) => {
    columns.forEach((col, col_index) => {
      worksheet.getRow(row_index + 2).getCell(col_index + 1).value = row[col_index];
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  respond.attachment('pregnants-list.xlsx');
  respond.send(buffer);
};

module.exports = router;
