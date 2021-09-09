'use strict';
const HEADER_ROWS_COUNT = 5;
const SIDE_COLS_COUNT = 6;
const express = require('express');
const router = express.Router();
const path = require('path');
const exceljs = require('exceljs');
const oracledb = require('oracledb');
const getQuery = require('../utils/get-sql-query');

const {
  ORACLE_DB_HOST,
  ORACLE_DB_PORT,
  ORACLE_DB_NAME,
  ORACLE_DB_USER,
  ORACLE_DB_PASS,
  // AUTH_CODE,
} = process.env;

router.get('/', showForm);
router.post('/', processFile);

function showForm(req, res, next) {
  const hbs = path.join('.', 'process-pfr-file.hbs');
  res.render(hbs);
}

async function processFile(req, res, next) {
  const { file } = req;

  if (!file || !file.filename) {
    console.log('File loader error!');
    res.send('Ошибка при загрузке файла');
    next();
    return;
  }

  const { filename } = file;

  let connection;
  try {
    connection = await oracledb.getConnection({
      connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
      user: ORACLE_DB_USER,
      password: ORACLE_DB_PASS,
    });
    const result = await processPfrData(filename, connection);
    res.attachment('result.xlsx');
    res.send(result);
  } catch (err) {
    console.error('catch', err);
    console.log('File loader error!');
    res.send('Ошибка при обработки файла');
    next();
    return;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('finally', err);
      }
    }
  }
  next();
}

async function processPfrData(filename, connection) {
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.readFile(path.join('uploads', filename));
  const worksheet = workbook.getWorksheet(1);
  worksheet.name = filename;
  await putPfrDataFromSheetToDB(worksheet, connection);
  await putPfrDataFromDBToSheet(connection, worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function putPfrDataFromSheetToDB(worksheet, connection) {
  const insertQuery = await getQuery('insert-into-from_pfr.sql');
  const binds = [];
  worksheet.eachRow(function(row, rowNumber) {
    if (rowNumber > HEADER_ROWS_COUNT) {
      binds.push({
        load_filename: worksheet.name,
        row_id: rowNumber,
        snils: `${row.getCell(5).value}`,
      });
    }
  });
  const options = {
    autoCommit: true,
    bindDefs: {
      load_filename: { type: oracledb.STRING, maxSize: 40 },
      row_id: { type: oracledb.NUMBER },
      snils: { type: oracledb.STRING, maxSize: 20 },
    },
  };
  console.log('insertQuery', insertQuery);
  console.log('binds', binds);
  console.log('options', options);
  const insertResult = await connection.executeMany(insertQuery, binds, options);
  console.log('Inserted rows:', insertResult);
  return insertResult;
}

async function putPfrDataFromDBToSheet(connection, worksheet) {
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
    'Дата постановки на учёт',
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
  const selectQuery = await getQuery('select-from_pfr-by-filename.sql');
  const selectResult = await connection.execute(selectQuery, [worksheet.name]);
  worksheet.spliceRows(1, HEADER_ROWS_COUNT, []);
  const header = worksheet.getRow(1);
  header.getCell(1).value = '№';
  header.getCell(2).value = 'Фамилия';
  header.getCell(3).value = 'Имя';
  header.getCell(4).value = 	'Отчество';
  header.getCell(5).value = 'СНИЛС';
  header.getCell(6).value = 'Медицинская организация';
  columns.forEach((item, index) => {
    if (index > 0) {
      header.getCell(index + SIDE_COLS_COUNT).value = item;
      worksheet.getColumn(index + SIDE_COLS_COUNT).width = 15;
    }
  });
  selectResult.rows.forEach((row, row_index) => {
    columns.forEach((col, col_index) => {
      if (col_index > 0)
        worksheet
          .getRow(row_index + 2)
          .getCell(col_index + SIDE_COLS_COUNT).value = row[col_index];
    });
  });
  for (let row = 1; row <= selectResult.rows.length + 1; row = row + 1){
    for (let col = 1; col <= HEADER_ROWS_COUNT + columns.length; col = col + 1){
      worksheet.getRow(row).getCell(col).border = {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'},
      };
    }
  }

}

module.exports = router;
