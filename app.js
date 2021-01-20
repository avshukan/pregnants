'use strict';
require('dotenv').config();
require('http-errors');
require('hbs');
const expressHbs = require('express-handlebars');
const path = require('path');
const express = require('express');
var multer = require('multer');
var upload = multer({ dest: './uploads' });
const ExcelJS = require('exceljs');
const oracledb = require('oracledb');
const getQuery = require('./utils/getQuery');

const {
  ORACLE_DB_HOST,
  ORACLE_DB_PORT,
  ORACLE_DB_NAME,
  ORACLE_DB_USER,
  ORACLE_DB_PASS,
} = process.env;
const app = express();

// app.use(logger(':remote-addr - :remote-user  [:date[iso]]  :method  :status
// :res[content-length]  HTTP/:http-version  :url  :referrer'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(corsHeadersService);
// app.use(mongoConnectorService);

const {
  indexRouter,
  pregnantsInfoRouter,
  // processFileRouter,
} = require('./routes');

app.use('/', indexRouter);
app.use('/info', pregnantsInfoRouter);
// app.use('/process-file', processFileRouter);
app.get('/process-file', upload.single('filedata'), showForm);
app.post('/process-file', upload.single('filedata'), processFile );

// app.use(function(req, res, next) {
//   next(createError(404));
// });

// app.use(function(err, req, res, next) {
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//   res.status(err.status || 500);
//   res.send('error');
// });

app.engine('hbs', expressHbs({
  layoutsDir: 'views/layouts',
  defaultLayout: 'layout',
  extname: 'hbs',
}),
);
app.set('view engine', 'hbs');

function showForm(req, res, next) {
  const hbs = './process-file.hbs';
  console.log('process-file get');
  res.render(hbs);
}

async function processFile(req, res, next) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
      user: ORACLE_DB_USER,
      password: ORACLE_DB_PASS,
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join('uploads', req.file.filename));
    const worksheet = workbook.getWorksheet(1);
    worksheet.name = req.file.filename;
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
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
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

module.exports = app;
