'use strict';
const sqlDir = 'sql';
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

async function getSQLQuery(filename) {
  const sqlFile = path.join(sqlDir, filename);
  const sqlQuery = await fsPromises.readFile(sqlFile, 'utf8');
  return sqlQuery;
}

module.exports = getSQLQuery;
