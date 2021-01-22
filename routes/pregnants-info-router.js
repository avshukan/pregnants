'use strict';
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
const oracledb = require('oracledb');

router.get('/', async function(req, res, next) {
  const { enp } = req.query;
  const {
    ORACLE_DB_HOST,
    ORACLE_DB_PORT,
    ORACLE_DB_NAME,
    ORACLE_DB_USER,
    ORACLE_DB_PASS,
  } = process.env;

  const sqlFile = path.join(__dirname, '..', 'sql', 'pregnants-info-by-enp.sql');
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
          .execute(sqlQuery, [enp])
          .then((result) => {
            if (!result.rows[0]) {
              const notFound = {error: 'Not Found'};
              res.json(notFound);
            } else {
              const found = result.rows[0];
              const answer = {
                CARD_DATE_START: found[0],
                CARD_DATE_END: found[1],
                PREGNANCY_DATE_START: found[2],
                PREGNANCY_DATE_END: found[3],
                REASON: found[4],
              };
              res.json(answer);
            }
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
});

module.exports = router;
