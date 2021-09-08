'use strict';
const VISIBLE_TD_COUNT = 5;
const HIDE_LINK_TEXT = 'Hide';
const SHOW_LINK_TEXT = 'Show';
const INNER_TABLE_FIELDS = [
  'Место рождения',
  'Документы',
  'Место регистрации',
  'Место фактического проживания',
  'Дата постановки на учёт',
  'Срок 12 недель',
  'Плановая дата окончания срока',
  'Дата снятия с учёта',
  'Контакты',
  'Отметка о согласии в соответствии с п.13 Соглашения',
  'Отметка о согласии в соответствии с п.14 Соглашения',
  'Отметка о согласии в соответствии с п.15 Соглашения',
];

function findListener(event) {
  event.preventDefault();
  const form = document.forms['getPersonInfo'];
  const snils = form.elements['snils'].value;
  const f = form.elements['f'].value;
  const i = form.elements['i'].value;
  const o = form.elements['o'].value;
  const dr = form.elements['dr'].value;
  getPersonInfo(snils, f, i, o, dr);
}

function downloadOnClick(event) {
  event.preventDefault();
  const form = document.forms['getPersonInfo'];
  const snils = form.elements['snils'].value;
  const f = form.elements['f'].value;
  const i = form.elements['i'].value;
  const o = form.elements['o'].value;
  const dr = form.elements['dr'].value;
  const url = `/get-pregnants-list/xlsx?snils=${snils}&f=${f}&i=${i}&o=${o}&dr=${dr}`;
  window.open(url, '_blank').focus();
}

function resetOnClick(event) {
  event.preventDefault();
  const form = document.forms['getPersonInfo'];
  form.reset();
  form.elements['snils'].value = '';
  form.elements['f'].value = '';
  form.elements['i'].value = '';
  form.elements['o'].value = '';
  form.elements['dr'].value = '';у
}

async function getPersonInfo(snils, f, i, o, dr) {
  const url = `/get-person-info/api?snils=${snils}&f=${f}&i=${i}&o=${o}&dr=${dr}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  // если запрос прошел нормально
  if (response.ok === true) {
    // получаем данные
    const data = await response.json();
    let data_tbody = document.querySelector('#data tbody');
    data_tbody.innerHTML = '';
    data.forEach((item, index) => {
      // добавляем полученные элементы в таблицу
      data_tbody.append(tr_visible(item, index));
      data_tbody.append(tr_hidden(item, index));
    });
  }
}

function tr_toggle(id) {
  const display_flag = $(id).attr('style');
  $(id).attr('style', display_flag === 'display: none;' ? 'display: contents;' : 'display: none;');
  return display_flag === 'display: none;' ? HIDE_LINK_TEXT : SHOW_LINK_TEXT;
}

function tr_visible(item, id) {
  const tr_visible = document.createElement('tr');
  tr_visible.setAttribute('id', `fio${id}`);
  Object.keys(item).filter((value, index) => index <= VISIBLE_TD_COUNT).forEach(key => {
    tr_visible.append(get_td(item[key]));
  });
  const a = document.createElement('a');
  a.appendChild(document.createTextNode('Show'));
  a.title = 'my title text';
  a.href = '';
  a.addEventListener('click', function(e){
    e.preventDefault();
    const text = tr_toggle(`#detail${id}`);
    a.innerHTML = text;
  });
  tr_visible.append(get_td(a));
  return tr_visible;
}

function tr_hidden(item, id) {
  const tbody = document.createElement('tbody');
  Object.keys(item).filter((value, index) => index > VISIBLE_TD_COUNT).forEach((key, index) => {
    const tr = document.createElement('tr');
    tr.append(get_td(INNER_TABLE_FIELDS[index]));
    tr.append(get_td(item[key] === null ? '' : item[key]));
    tbody.append(tr);
  });
  const table = document.createElement('table');
  table.setAttribute('width', '100%');
  table.append(tbody);
  const td = document.createElement('td');
  td.setAttribute('colspan', `${VISIBLE_TD_COUNT + 2}`);
  td.append(table);
  const tr_hidden = document.createElement('tr');
  tr_hidden.append(td);
  tr_hidden.setAttribute('id', `detail${id}`);
  tr_hidden.setAttribute('style', 'display: none;');
  return tr_hidden;
}

function get_td(value) {
  const td = document.createElement('td');
  td.append(value);
  return td;
}

module.exports.getPersonInfo = getPersonInfo;
module.exports.findListener = findListener;
module.exports.downloadOnClick = downloadOnClick;
module.exports.resetOnClick = resetOnClick;
