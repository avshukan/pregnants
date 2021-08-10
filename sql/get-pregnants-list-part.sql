WITH
pregnancy_diary AS (
  SELECT
      PREGNANCY.ID PREGNANCY_ID
    , diary.VIS_DATE AS VISIT_DATE-- Дата посещения
    , params.PRP_NAME AS VISIT_NAME -- Течение беременности
    , 1 + TRUNC((diary.VIS_DATE - pregnancy.BEGIN_DATE)/7) AS VISIT_WEEK -- Неделя посещения
  FROM D_AGENT_PREGNANCY pregnancy
  INNER JOIN D_AGENT_PRGN_DIARY diary
    ON diary.PID = PREGNANCY.ID
  LEFT JOIN D_PREG_PARAMS params
    ON diary.PREG_PARAM = params.ID
),
pregnancy_weeks AS (
  SELECT
  	  PREGNANCY_ID
  	, LISTAGG('Неделя ' || TO_CHAR(VISIT_WEEK) || ' (' || TO_CHAR(VISIT_DATE, 'DD.MM.YYYY') || '): ' || VISIT_NAME, ';' || CHR(10) || CHR(13))
      WITHIN GROUP (ORDER BY VISIT_DATE) VISIT_INFO
  FROM pregnancy_diary
  GROUP BY PREGNANCY_ID
),
supertable AS (
  SELECT
  	  ROW_NUMBER() OVER (PARTITION BY agent.SURNAME, FIRSTNAME, LASTNAME, BIRTHDATE ORDER BY pregnancy.BEGIN_DATE DESC) AS rownumber
    , agent.SURNAME															-- Фамилия беременной
    , agent.FIRSTNAME														-- Имя беременной
    , agent.LASTNAME														-- Отчество беременной
    , TO_CHAR(agent.BIRTHDATE, 'DD.MM.YYYY') AS BIRTHDATE					-- ДР беременной
    , agent.ENP				  												-- ЕНП
    , SNILS AS SNILS11
    , DECODE(SNILS,
      NULL,
      NULL,
      SUBSTR(TO_CHAR(SNILS), 1, 3) || '-'
      || SUBSTR(TO_CHAR(SNILS), 4, 3)  || '-'
      || SUBSTR(TO_CHAR(SNILS), 7, 3)  || ' '
      || SUBSTR(TO_CHAR(SNILS), 10, 2)
      ) AS SNILS   															-- СНИЛС
    , CASE
  	    WHEN card.DATE_IN - pregnancy.BEGIN_DATE <= 12*7
  	      THEN 'ДА'
  	    ELSE 'НЕТ'
      END AS EARLY_FACT														-- Факт постановки на учёт на ранних сроках                                                -- Факт постановки на учёт на ранних сроках
    , card.DATE_IN - pregnancy.BEGIN_DATE AS GESTATIONAL_AGE_IN_DAYS        -- Cрок в днях на момент заведения карты
    , 1 + TRUNC((card.DATE_IN - pregnancy.BEGIN_DATE)/7)
        AS GESTATIONAL_AGE_IN_WEEKS                                         -- Cрок в неделях на момент заведения карты
    , TO_CHAR(card.DATE_IN, 'DD.MM.YYYY') AS CARD_DATE_START                -- Дата открытия карты беременной
    , TO_CHAR(card.DATE_OUT, 'DD.MM.YYYY') AS CARD_DATE_END                 -- Дата закрытия карты беременной
    , TO_CHAR(pregnancy.BEGIN_DATE, 'DD.MM.YYYY') AS PREGNANCY_DATE_START   -- Дата начала срока
    , TO_CHAR(pregnancy.END_DATE, 'DD.MM.YYYY') AS PREGNANCY_DATE_END       -- Дата окончания срока
    , TO_CHAR(
    	  NVL(pregnancy.PLAN_END_DATE, pregnancy.BEGIN_DATE + 280)
    	, 'DD.MM.YYYY'
	  ) AS PLAN_DATE_END                                                      -- Плановая дата окончания срока
    , reason.NAME AS REASON                                                 -- Причина закрытия индивидуальной карты
    , po.PO_NAME                                                            -- Исход беременности
    , lpu.LPU_NAME                                                          -- ЛПУ
    , pregnancy_weeks.VISIT_INFO AS VISIT_INFO                              -- Неделя посещения
  FROM D_PREGNANT_CARDS card
  INNER JOIN D_AGENTS agent
    ON agent.ID = card.AGENT
  INNER JOIN D_AGENT_PREGNANCY pregnancy
    ON pregnancy.id = card.PREGNANCY
  LEFT JOIN D_PREGC_OUT_REASONS reason
    ON reason.ID = card.OUT_REASON
  LEFT JOIN D_PREGC_OUT_REASONS reason
    ON reason.ID = card.OUT_REASON
  LEFT JOIN D_PREGNANCY_OUTCOMES po -- Исходы беременностей (хроникальный)
    ON po.ID = pregnancy.PREG_OUTCOME
  LEFT JOIN D_LPUDICT lpu
    ON lpu.ID = card.LPU_IN
  LEFT JOIN pregnancy_weeks
    ON pregnancy_weeks.PREGNANCY_ID = PREGNANCY.ID
  WHERE 1 = 1
    AND lpu.ID != 75427859 -- СОМИАЦ
    AND lpu.ID != 173922227 -- "Тестовое МО"
--  AND (
--    reason.NAME = 'Беременность закончилась родами'
--    OR
--    po.PO_NAME = 'Рождение ребёнка'
--  )
--    AND card.DATE_IN >= TO_DATE('20200701', 'YYYYMMDD')
--    AND TO_CHAR(card.DATE_OUT, 'YYYYMM') IS NULL
--    AND TO_CHAR(pregnancy.END_DATE, 'YYYYMM') IS NULL
    AND agent.SURNAME IS NOT NULL
),
resulttable AS (
  SELECT
      SURNAME					-- Фамилия беременной
    , FIRSTNAME					-- Имя беременной
    , LASTNAME					-- Отчество беременной
    , BIRTHDATE					-- ДР беременной
--  , ENP				  		-- ЕНП
    , SNILS11 					-- СНИЛС как 11 символов
    , SNILS   					-- СНИЛС
    , EARLY_FACT				-- Факт постановки на учёт на ранних сроках
    , GESTATIONAL_AGE_IN_DAYS	-- Cрок в днях на момент заведения карты
    , GESTATIONAL_AGE_IN_WEEKS	-- Cрок в неделях на момент заведения карты
    , CARD_DATE_START		    -- Дата открытия карты беременной
    , CARD_DATE_END				-- Дата закрытия карты беременной
    , PREGNANCY_DATE_START		-- Дата начала срока
    , PREGNANCY_DATE_END		-- Дата окончания срока
    , PLAN_DATE_END				-- Плановая дата окончания срока
    , REASON  	                -- Причина закрытия индивидуальной карты
    , PO_NAME					-- Исход беременности
    , LPU_NAME      			-- ЛПУ
    , VISIT_INFO 				-- Неделя посещения
  FROM supertable
  WHERE rownumber = 1 -- последняя беременность
)
SELECT
      ROWNUM
    , SURNAME
    , FIRSTNAME
    , LASTNAME
    , BIRTHDATE
    , resulttable.SNILS
    , EARLY_FACT
    , GESTATIONAL_AGE_IN_DAYS
    , GESTATIONAL_AGE_IN_WEEKS
    , CARD_DATE_START
    , CARD_DATE_END
    , PREGNANCY_DATE_START
    , PREGNANCY_DATE_END
    , PLAN_DATE_END
    , REASON
    , PO_NAME
    , LPU_NAME
    , VISIT_INFO
FROM resulttable
WHERE 1 = 1
  AND ROWNUM < 5
  AND SURNAME IS NOT NULL
ORDER BY 1, 2, 3, 4, 5