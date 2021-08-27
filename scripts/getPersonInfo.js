'use strict';
const VISIBLE_TD_COUNT = 5;

async function getPersonInfo(snils, f, i, o, dr) {
  const url = `/get-person-info/api?snils=${snils}&f=${f}&i=${i}&o=${o}&dr=${dr}`;
  console.log('url', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
    // заполнение формы - надо?
    // if (response.ok === true) {
    //     const user = await response.json();
    //     const form = document.forms["userForm"];
    //     form.elements["id"].value = user.id;
    //     form.elements["name"].value = user.name;
    //     form.elements["age"].value = user.age;
    // }
    // если запрос прошел нормально
  if (response.ok === true) {
    // получаем данные
    const data = await response.json();
    let rows = document.querySelector('tbody');
    data.forEach(item => {
      // добавляем полученные элементы в таблицу
      rows.append(tr_visible(item));
      rows.append(tr_hidden(item));
    });
  }
}

function tr_visible(item) {
  const tr_visible = document.createElement('tr');
  Object.keys(item).filter((value, index) => index <= VISIBLE_TD_COUNT).forEach(key => {
    tr_visible.append(get_td(item[key]));
  });
  tr_visible.append(get_td('Показать'));
  return tr_visible;
}

function tr_hidden(item) {
  const tbody = document.createElement('tbody');
  Object.keys(item).filter((value, index) => index > VISIBLE_TD_COUNT).forEach((key, index) => {
    const tr = document.createElement('tr');
    tr.append(get_td(index));
    tr.append(get_td(item[key]));
    tbody.append(tr);
  });
  const table = document.createElement('table');
  table.append(tbody);
  const td = document.createElement('td');
  td.setAttribute('colspan', `${VISIBLE_TD_COUNT + 2}`);
  td.append(table);
  const tr_hidden = document.createElement('tr');
  tr_hidden.append(td);
  return tr_hidden;
}

function table_hidden(data) {
  const td = document.createElement('td');
  td.append(value);
  return td;
}

function get_td(value) {
  const td = document.createElement('td');
  td.append(value);
  return td;
}
