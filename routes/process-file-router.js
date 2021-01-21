'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const ExcelJS = require('exceljs');
const oracledb = require('oracledb');
const getQuery = require('../utils/getQuery');

const {
  ORACLE_DB_HOST,
  ORACLE_DB_PORT,
  ORACLE_DB_NAME,
  ORACLE_DB_USER,
  ORACLE_DB_PASS,
  AUTH_CODE,
} = process.env;

router.get('/', showForm);
router.post('/', processFile);

function showForm(req, res, next) {
  const hbs = './process-file.hbs';
  res.render(hbs);
}

async function processFile(req, res, next) {
  const { body, file } = req;

  if (!body || !body.auth_code || (body.auth_code !== AUTH_CODE)) {
    console.log('AUTH_CODE error!');
    res.send('Неверный код авторизации');
    next();
    return;
  }

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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join('uploads', filename));
    const worksheet = workbook.getWorksheet(1);
    worksheet.name = filename;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;
    worksheet.getRow(1).getCell(6).value = 'DATE FROM';
    worksheet.getRow(1).getCell(7).value = 'DATE TO';
    await putDataFromSheetToDB(worksheet, connection);
    await putDataFromDBToSheet(connection, worksheet);
    const buffer = await workbook.xlsx.writeBuffer();
    res.attachment('result.xlsx');
    res.send(buffer);
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

async function putDataFromSheetToDB(worksheet, connection) {
  const insertQuery = await getQuery('insert-into-x_pregnants.sql');
  const binds = [];
  worksheet.eachRow(function(row, rowNumber) {
    if (rowNumber > 1) {
      binds.push({
        load_filename: worksheet.name,
        row_id: rowNumber,
        surname: row.getCell(1).value,
        firstname: row.getCell(2).value,
        lastname: row.getCell(3).value,
        birthdate: row.getCell(4).value,
        snils: row.getCell(5).value,
      });
    }
  });
  const options = {
    autoCommit: true,
    bindDefs: {
      load_filename: { type: oracledb.STRING, maxSize: 40 },
      row_id: { type: oracledb.NUMBER },
      surname: { type: oracledb.STRING, maxSize: 100 },
      firstname: { type: oracledb.STRING, maxSize: 100 },
      lastname: { type: oracledb.STRING, maxSize: 100 },
      birthdate: { type: oracledb.STRING, maxSize: 20 },
      snils: { type: oracledb.STRING, maxSize: 20 },
    },
  };
  const insertResult = await connection.executeMany(insertQuery, binds, options);
  console.log('Inserted rows:', insertResult);
  return insertResult;
}

async function putDataFromDBToSheet(connection, worksheet) {
  const selectQuery = await getQuery('select-x_pregnants-by-filename.sql');
  const selectResult = await connection.execute(selectQuery, [worksheet.name]);
  selectResult.rows.forEach(item => {
    const row = worksheet.getRow(item[0]);
    row.getCell(6).value = item[6];
    row.getCell(7).value = item[7];
  });
}

module.exports = router;
