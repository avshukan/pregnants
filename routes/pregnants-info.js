const express = require('express');
const router = express.Router();

router.get('/', async function(req, res, next) {
  // res.send({ message: 'Info' });
  const { ORACLE_DB_PATH, ORACLE_DB_HOST, ORACLE_DB_PORT, ORACLE_DB_NAME, ORACLE_DB_USER, ORACLE_DB_PASS } = process.env;
  console.log(ORACLE_DB_PATH);
  let oracledb = require('oracledb')
  let connection;
  try {
    oracledb.initOracleClient({libDir: ORACLE_DB_PATH});
    // oracledb.initOracleClient({libDir: 'C:\\Oracle\\instantclient_19_9'});
    console.error('Init!');
    oracledb
    // .getConnection({
    //   user: 'miac',
    //   password: 'defmiac',
    //   connectString: 'localhost:1521/mis',
    // })
    .getConnection({
      connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
      user: ORACLE_DB_USER,
      password: ORACLE_DB_PASS,
    })
      .then((conn) => {
        connection = conn;
        console.error('Connection!', connection);
        connection
        .execute(`SELECT COUNT(*) FROM DEV.D_AGENTS`)
        .then((result) => {
          console.log('execute!');
          // console.log(result);
          res.send({ message: result });
        })
        .catch((err) => {
          console.error('Can\'t execute!');
          throw err;
        })
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    console.error('Whoops!');
    console.error(err);
    process.exit(1);
  }  


  // const { createdOn = getNowDate() } = req.query;
  // const count = await req.db.collection('tasks')
  //   .count({'createdOn': new RegExp(createdOn, 'gi')});
  //   res.send({
  //     date: createdOn,
  //     tasks_count: count,
  //   });
});

module.exports = router;
