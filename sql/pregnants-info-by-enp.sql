  WITH pregnants AS (
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
  )
  SELECT
    CARD_DATE_START,
    CARD_DATE_END,
    PREGNANCY_DATE_START,
    PREGNANCY_DATE_END,
    REASON
  FROM PREGNANTS
  WHERE 1 = 1
    AND r = 1
    AND ENP = :enp