const express = require('express');
const router = express.Router();

router.get('/', async function(req, res, next) {
  const { enp } = req.query;
  console.log('enp', enp);
  const { ORACLE_DB_HOST, ORACLE_DB_PORT, ORACLE_DB_NAME, ORACLE_DB_USER, ORACLE_DB_PASS } = process.env;
  const query = `
  WITH pregnants AS (
    SELECT
      ROW_NUMBER() OVER (PARTITION BY agent.id ORDER BY card.DATE_IN DESC NULLS FIRST) AS r,
      agent.SURNAME,			-- Фамилия беременной
      agent.FIRSTNAME,		-- Имя беременной
      agent.LASTNAME,			-- Отчество беременной
      agent.BIRTHDATE,		-- ДР беременной
      agent.ENP,				-- ЕНП
      agent.SNILS,			-- СНИЛС
      card.DATE_IN,			-- Дата открытия карты беременной
      card.DATE_OUT,			-- Дата закрытия карты беременной
      pregnancy.BEGIN_DATE,	-- Дата начала срока
      pregnancy.END_DATE,		-- Дата окончания срока
      reason.NAME AS REASON  	-- Причина закрытия индивидуальной карты
    FROM D_PREGNANT_CARDS card
    INNER JOIN D_AGENTS agent
      ON agent.ID = card.AGENT
    INNER JOIN D_AGENT_PREGNANCY pregnancy
      ON pregnancy.id = card.PREGNANCY
    LEFT JOIN D_PREGC_OUT_REASONS reason
      ON reason.ID = card.OUT_REASON
  )
  SELECT
    SURNAME,
    FIRSTNAME,
    LASTNAME,
    BIRTHDATE,
    ENP,
    SNILS,
    DATE_IN,
    DATE_OUT,
    BEGIN_DATE,
    END_DATE,
    REASON
  FROM PREGNANTS
  WHERE 1 = 1
    AND r = 1
    AND ENP = :enp`;
  let oracledb = require('oracledb');
  let connection;
  try {
    oracledb
    .getConnection({
      connectString: `${ORACLE_DB_HOST}:${ORACLE_DB_PORT}/${ORACLE_DB_NAME}`,
      user: ORACLE_DB_USER,
      password: ORACLE_DB_PASS,
    })
      .then((conn) => {
        connection = conn;
        connection
        .execute(query, [enp])
        .then((result) => {
          console.log('execute!');
          // console.log(result);
          const answer = result.rows[0];
          console.log(answer);
          res.send(answer);
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
