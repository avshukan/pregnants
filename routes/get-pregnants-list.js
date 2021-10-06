'use strict';
const express = require('express');
const router = express.Router();
const exceljs = require('exceljs');
const getListApi = require('../api/get-list-api.js');


router.get('/xlsx', async function(req, res, next) {
  const {query} = req;
  const info = await getListApi(query);
  xlsxHandler(res)(info);
});

router.get('/all/json', async function(req, res, next) {
  const info = await getListApi({});
  jsonHandler(res)(info);
});

router.get('/all/xlsx', async function(req, res, next) {
  const {query} = req;
  const info = await getListApi(query);
  xlsxHandler(res)(info);
});

router.get('/last/json', async function(req, res, next) {
  const info = await getListApi({r: 1});
  jsonHandler(res)(info);
});

router.get('/last/xlsx', async function(req, res, next) {
  const info = await getListApi({r: 1});
  xlsxHandler(res)(info);
});

router.get('/part/json', async function(req, res, next) {
  const info = await getListApi({r: 1, limit: 10});
  jsonHandler(res)(info);
});

router.get('/part/xlsx', async function(req, res, next) {
  const info = await getListApi({r: 1, limit: 10});
  xlsxHandler(res)(info);
});

const jsonHandler = (respond) => async(data) => {
  respond.json(data);
};

const xlsxHandler = (respond) => async(data) => {
  const columns = [
    '№',
    'СНИЛС',
    'Фамилия',
    'Имя',
    'Отчество',
    'ДР',
    'Место рождения',
    'Документы',
    'Место регистрации',
    'Место фактического проживания',
    'Дата постановки на учёт',
    'Срок 12 недель',
    'Плановая дата окончания срока',
    // 'Дата снятия с учёта',
    'Дата окончания срока',
    'Исход беременности',
    'Контакты',
    'Отметка о согласии в соответствии с п.13 Соглашения',
    'Отметка о согласии в соответствии с п.14 Соглашения',
    'Отметка о согласии в соответствии с п.15 Соглашения',
    'Район',
  ];
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Preganants List');
  // worksheet.getColumn(6).width = 15;
  // worksheet.getRow(1).getCell(6).value = 'DATE FROM';
  const header = worksheet.getRow(1);
  columns.forEach((item, index) => {
    header.getCell(index + 1).value = item;
  });
  data.forEach((row, row_index) => {
    columns.forEach((col, col_index) => {
      worksheet.getRow(row_index + 2).getCell(col_index + 1).value = row[col_index];
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  respond.attachment('pregnants-list.xlsx');
  respond.send(buffer);
};

module.exports = router;
