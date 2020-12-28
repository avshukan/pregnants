const express = require('express');
const router = express.Router();

router.get('/', async function(req, res, next) {
  res.send({ message: 'Info' });
  let oracledb = require('oracledb')
  let connection;
  try {
    oracledb.initOracleClient({libDir: 'C:\\Oracle\\instantclient_19_9'});
    console.error('Init!');
    oracledb
      .getConnection({
        user: 'miac',
        password: 'defmiac',
        connectString: 'localhost:1521/mis',
      })
      .then((conn) => {
        connection = conn;
        console.error('Connection!', connection);
        connection
        .execute(`SELECT COUNT(*) FROM DEV.D_AGENTS`)
        .then((result) => {
          console.log('execute!');
          console.log(result)
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
