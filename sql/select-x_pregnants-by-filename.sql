WITH  pregnants AS (
  SELECT
    ROW_NUMBER() OVER (PARTITION BY agent.id ORDER BY card.DATE_IN DESC NULLS FIRST) AS r,
    agent.SURNAME,			-- Фамилия беременной
    agent.FIRSTNAME,		-- Имя беременной
    agent.LASTNAME,			-- Отчество беременной
    agent.BIRTHDATE,		-- ДР беременной
    agent.ENP,				  -- ЕНП
    agent.SNILS,		  	-- СНИЛС
    TO_CHAR(card.DATE_IN, 'YYYY-MM-DD') AS CARD_DATE_START,		          	-- Дата открытия карты беременной
    TO_CHAR(card.DATE_OUT, 'YYYY-MM-DD') AS CARD_DATE_END,	          		-- Дата закрытия карты беременной
    TO_CHAR(pregnancy.BEGIN_DATE, 'YYYY-MM-DD') AS PREGNANCY_DATE_START,	-- Дата начала срока
    TO_CHAR(pregnancy.END_DATE, 'YYYY-MM-DD') AS PREGNANCY_DATE_END,  		-- Дата окончания срока
    reason.NAME AS REASON  	                                              -- Причина закрытия индивидуальной карты
  FROM D_PREGNANT_CARDS card
  INNER JOIN D_AGENTS agent
    ON agent.ID = card.AGENT
  INNER JOIN D_AGENT_PREGNANCY pregnancy
    ON pregnancy.id = card.PREGNANCY
  LEFT JOIN D_PREGC_OUT_REASONS reason
    ON reason.ID = card.OUT_REASON
),
last_pregnants AS (
  SELECT
  	SURNAME,
    FIRSTNAME,
    LASTNAME,
    BIRTHDATE,
    ENP,
    SNILS,
    CARD_DATE_START,
    CARD_DATE_END,
    PREGNANCY_DATE_START,
    PREGNANCY_DATE_END,
    REASON
  FROM PREGNANTS
  WHERE r = 1
),
filedata AS (
	SELECT
		ROW_ID,
		SURNAME,
		FIRSTNAME,
		LASTNAME,
		BIRTHDATE,
		SNILS
	FROM X_SOMIAC.X_PREGNANTS
	WHERE LOAD_FILENAME = :load_filename
)
SELECT
	filedata.ROW_ID,
	filedata.SURNAME,
	filedata.FIRSTNAME,
	filedata.LASTNAME,
	filedata.BIRTHDATE,
	filedata.SNILS,
	last_pregnants.PREGNANCY_DATE_START,
  last_pregnants.PREGNANCY_DATE_END
FROM filedata
LEFT OUTER JOIN last_pregnants
	ON (filedata.SURNAME = LAST_PREGNANTS.SURNAME
		AND filedata.FIRSTNAME = LAST_PREGNANTS.FIRSTNAME
		AND filedata.LASTNAME = LAST_PREGNANTS.LASTNAME
		AND filedata.BIRTHDATE = TO_CHAR(LAST_PREGNANTS.BIRTHDATE, 'DD.MM.YYYY'))
ORDER BY
	ROW_ID