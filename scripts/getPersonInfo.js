'use strict';
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
      rows.append(tr(item));
    });
  }
}

function tr(item) {
  const tr = document.createElement('tr');
  Object.keys(item).forEach(key => {
    tr.append(td(item[key]));
  });
  // tr.append(td(item[1]));
  // tr.append(td(item[2]));
  // tr.append(td(item[3]));
  // tr.append(td(item[4]));
  return tr;
}

function td(value) {
  const td = document.createElement('td');
  td.append(value);
  return td;
}
