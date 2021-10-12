WITH
pfr AS (
	SELECT
		"File" AS F,
		"Row" AS R,
		SNILS,
		lpad(REPLACE(REPLACE(SNILS, '-', ''), ' ', ''), 11, '0') AS SNILS11
	FROM X_SHUKAN.FROM_PFR
	WHERE 1 = 1
		AND "File" = :load_filename
),
districts AS (
  SELECT
    ID city_id
  , GEONAME city_name
  , CASE
      when kladr_code like ('65000%') then 'Южно-Сахалинск г'
      when kladr_code like ('65002%') then 'Анивский р-н'
      when kladr_code like ('65003%') then 'Долинский р-н'
      when kladr_code like ('65004%') then 'Корсаковский р-н'
      when kladr_code like ('65005%') then 'Курильский р-н'
      when kladr_code like ('65006%') then 'Макаровский р-н'
      when kladr_code like ('65007%') then 'Невельский р-н'
      when kladr_code like ('65008%') then 'Ногликский р-н'
      when kladr_code like ('65009%') then 'Охинский р-н'
      when kladr_code like ('65010%') then 'Поронайский р-н'
      when kladr_code like ('65011%') then 'Северо-Курильский р-н'
      when kladr_code like ('65012%') then 'Смирныховский р-н'
      when kladr_code like ('65013%') then 'Томаринский р-н'
      when kladr_code like ('65014%') then 'Тымовский р-н'
      when kladr_code like ('65015%') then 'Углегорский р-н'
      when kladr_code like ('65016%') then 'Холмский р-н'
      when kladr_code like ('65017%') then 'Южно-Курильский р-н'
      when kladr_code like ('65018%') then 'Александровск-Сахалинский р-н'
      ELSE ''
    END raion_name
  FROM DEV.D_GEOGRAFY
),
address_details AS (
  SELECT
      adr.ID ID
    , adr.pid PID
    , is_real
    , districts.city_name city
    , districts.raion_name raion
    , streets.geoname street
    , house
    , houselit
    , block
    , flatlit
    , flat
    , addr_index
    , adr.BEGIN_date
    , adr.end_date
    , ROW_NUMBER () OVER (PARTITION BY adr.pid, adr.is_real ORDER BY adr.begin_date DESC NULLS last) r
  FROM dev.D_AGENT_ADDRS adr
  LEFT OUTER JOIN districts
    ON districts.city_id = adr.city
  LEFT OUTER JOIN DEV.D_GEOGRAFY streets
    ON streets.id = adr.street
--  WHERE is_real = 1
),
address AS (
  SELECT
      PID
    , IS_REAL
    , city
      || DECODE(STREET, NULL, '', ' ' || STREET)
      || DECODE(HOUSE, NULL, '', ' д.' || HOUSE || HOUSELIT)
      || DECODE(BLOCK, NULL, '', '-' || BLOCK) ADR
    , raion
  FROM address_details
  WHERE r = 1
),
docs AS (
  SELECT PID, DOC
  FROM (
    SELECT
        PID
      , PD_SER || ' ' || PD_NUMB DOC
      , ROW_NUMBER() OVER (PARTITION BY PID ORDER BY PD_WHEN DESC) R
    FROM dev.D_AGENT_PERSDOCS dap
  )
  WHERE R = 1
),
contacts AS (
  SELECT
      PID
    , listagg(contact, ', ') WITHIN GROUP (ORDER BY id) AS CONTACTS_LIST
  FROM (
    SELECT *
    FROM dev.D_AGENT_CONTACTS
--    WHERE contact NOT LIKE '%@%'
  )
  GROUP BY PID
),
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
  	  ROW_NUMBER() OVER (PARTITION BY agent.SURNAME, FIRSTNAME, LASTNAME, BIRTHDATE ORDER BY pregnancy.BEGIN_DATE DESC) AS PREGNANCY_COUNTER
    , agent.SURNAME                                                           -- Фамилия беременной
    , agent.FIRSTNAME                                                         -- Имя беременной
    , agent.LASTNAME                                                          -- Отчество беременной
    , TO_CHAR(agent.BIRTHDATE, 'DD.MM.YYYY') AS BIRTHDATE                     -- ДР беременной
    , agent.BIRTHPLACE                                                        -- Место рождения
    , agent.ENP                                                               -- ЕНП
    , agent.SNILS AS SNILS11
    , DECODE(agent.SNILS,
        NULL,
        NULL,
        SUBSTR(TO_CHAR(agent.SNILS), 1, 3) || '-'
        || SUBSTR(TO_CHAR(agent.SNILS), 4, 3)  || '-'
        || SUBSTR(TO_CHAR(agent.SNILS), 7, 3)  || ' '
        || SUBSTR(TO_CHAR(agent.SNILS), 10, 2)
      ) AS SNILS   		                              												  -- СНИЛС
    , TO_CHAR(pregnancy.REG_DATE, 'DD.MM.YYYY') AS PREGNANCY_REG_DATE         -- Дата постановки на учёт
--    , TO_CHAR(card.DATE_IN, 'DD.MM.YYYY') AS CARD_DATE_START                  -- Дата открытия карты беременной
--    , TO_CHAR(card.DATE_OUT, 'DD.MM.YYYY') AS CARD_DATE_END                   -- Дата закрытия карты беременной
    , TO_CHAR(pregnancy.BEGIN_DATE, 'DD.MM.YYYY') AS PREGNANCY_DATE_START     -- Дата начала срока
    , TO_CHAR(pregnancy.END_DATE, 'DD.MM.YYYY') AS PREGNANCY_DATE_END         -- Дата окончания срока
    , TO_CHAR(pregnancy.BEGIN_DATE + 7*12, 'DD.MM.YYYY') AS PREGNANCY_WEEK_12 -- Срок 12 недель
    , TO_CHAR(pregnancy.PLAN_END_DATE, 'DD.MM.YYYY') AS PLAN_DATE_END         -- Плановая дата окончания срока
--    , reason.NAME AS REASON                                                   -- Причина закрытия индивидуальной карты
    , po.PO_NAME                                                              -- Исход беременности
    , lpu.LPU_NAME                                                            -- ЛПУ
--    , pregnancy_weeks.VISIT_INFO AS VISIT_INFO                                -- Информация о посещениях
    , docs.DOC                                                                -- Паспорт
    , contacts.CONTACTS_LIST                                                  -- Контакты (телефоны)
    , address_r.ADR ADDRESS_REG                                               -- Место регистрации
    , address_f.ADR ADDRESS_FACT                                              -- Место фактического проживания
    , address_f.RAION RAION                                                   -- Район фактического проживания
  FROM D_PREGNANT_CARDS card
  INNER JOIN D_AGENTS agent
    ON agent.ID = card.AGENT
  INNER JOIN D_AGENT_PREGNANCY pregnancy
    ON pregnancy.id = card.PREGNANCY
--  LEFT JOIN D_PREGC_OUT_REASONS reason
--    ON reason.ID = card.OUT_REASON
  LEFT JOIN D_PREGNANCY_OUTCOMES po -- Исходы беременностей (хроникальный)
    ON po.ID = pregnancy.PREG_OUTCOME
  LEFT JOIN D_LPUDICT lpu
    ON lpu.ID = card.LPU_IN
--  LEFT JOIN pregnancy_weeks
--    ON pregnancy_weeks.PREGNANCY_ID = PREGNANCY.ID
  LEFT JOIN docs
    ON docs.PID = agent.ID
  LEFT JOIN contacts
    ON contacts.PID = agent.ID
  LEFT JOIN address address_r
    ON address_r.PID = agent.ID AND address_r.IS_REAL = 0
  LEFT JOIN address address_f
    ON address_f.PID = agent.ID AND address_f.IS_REAL = 1
  WHERE 1 = 1
    AND lpu.ID != 75427859 -- СОМИАЦ
    AND lpu.ID != 173922227 -- "Тестовое МО"
),
resulttable AS (
  SELECT DISTINCT
      SURNAME                -- Фамилия беременной
    , FIRSTNAME              -- Имя беременной
    , LASTNAME               -- Отчество беременной
    , BIRTHDATE              -- ДР беременной
    , BIRTHPLACE             -- Место рождения
    , ADDRESS_REG            -- Место регистрации
    , ADDRESS_FACT           -- Место фактического проживания
    , SNILS11                -- СНИЛС как 11 символов
    , SNILS                  -- СНИЛС
    , PREGNANCY_REG_DATE     -- Дата постановки на учёт
    -- , '' PREGNANCY_REG_END   -- Дата снятия с учёта
--    , CARD_DATE_START        -- Дата открытия карты беременной
--    , CARD_DATE_END          -- Дата закрытия карты беременной
    , PREGNANCY_DATE_START   -- Дата начала срока
    , PREGNANCY_DATE_END     -- Дата окончания срока
    , PREGNANCY_WEEK_12      -- Срок 12 недель
    , PLAN_DATE_END          -- Плановая дата окончания срока
--    , REASON                 -- Причина закрытия индивидуальной карты
    , PO_NAME                -- Исход беременности
--    , LPU_NAME               -- ЛПУ
--    , VISIT_INFO             -- Неделя посещения
    , DOC                    -- Паспорт
    , CONTACTS_LIST          -- Контакты (телефоны)
    , 'НЕТ' FLAG13           -- Отметка о согласии в соответствии с п.13 Соглашения
    , 'НЕТ' FLAG14           -- Отметка о согласии в соответствии с п.14 Соглашения
    , 'НЕТ' FLAG15           -- Отметка о согласии в соответствии с п.15 Соглашения
    , RAION                  -- Район фактического проживания
  FROM supertable
  WHERE 1 = 1
    AND SURNAME IS NOT NULL
    AND PREGNANCY_COUNTER = 1
    -- AND (:r IS NULL OR PREGNANCY_COUNTER <= :r)
    -- AND (:snils IS NULL OR :snils = SNILS11)
  	-- AND (:f IS NULL OR LOWER(:f) = LOWER(SURNAME))
  	-- AND (:i IS NULL OR LOWER(:i) = LOWER(FIRSTNAME))
  	-- AND (:o IS NULL OR LOWER(:o) = LOWER(LASTNAME))
  	-- AND (:dr IS NULL OR TO_DATE(:dr, 'DD.MM.YYYY') = BIRTHDATE)
)
SELECT
      pfr.R
    , NVL(resulttable.SNILS, pfr.SNILS) SNILS
    , SURNAME
    , FIRSTNAME
    , LASTNAME
    , BIRTHDATE
    , BIRTHPLACE
    , DOC
    , ADDRESS_REG
    , ADDRESS_FACT
    , PREGNANCY_REG_DATE
    , PREGNANCY_WEEK_12
    , PLAN_DATE_END
    , PREGNANCY_DATE_END
    , PO_NAME
    , CONTACTS_LIST
    , FLAG13
    , FLAG14
    , FLAG15
    , RAION
FROM pfr
LEFT OUTER JOIN resulttable
	ON pfr.SNILS11 = resulttable.SNILS11
ORDER BY pfr.F, pfr.R