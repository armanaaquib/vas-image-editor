const optionChange = function (option) {
  option.onchange = function () {
    if (option.value == 'resize') {
      document.getElementById('resizing').style.display = 'block';
      document.getElementById('rotation').style.display = 'none';
    } else {
      document.getElementById('rotation').style.display = 'block';
      document.getElementById('resizing').style.display = 'none';
    }
  };
};

const download = function (links, fileNames) {
  const statusBar = document.getElementById('status');
  if (links.length == 0) {
    statusBar.innerHTML = '<a href="/"> Please upload image file... </a>';
    return;
  }
  let child = null;
  while (child = statusBar.firstChild) {
    child.remove();
  }
  for (each in links) {
    const link = document.createElement('a');
    link.href = `http://${links[each]}`;
    link.innerText = `${fileNames[each]} - Download`;
    statusBar.appendChild(link);
    statusBar.appendChild(document.createElement('br'));
    statusBar.appendChild(document.createElement('br'));
  }
};

const wait = function (id, fileNames) {
  console.log(id, fileNames);
  document.getElementById('image').style.display = 'none';
  let modified = 0,
    links = [];
  const interval = setInterval(() => {
    if (modified == id.length) {
      clearInterval(interval);
      download(links, fileNames);
    }
    for (let i in id) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/status/${id[i]}`);
      xhr.send();
      xhr.onload = function () {
        const res = JSON.parse(event.target.response);
        document.getElementById(`file-${i}`).innerText = `${fileNames[i]} - ${res.status}`;
        if (res.status == 'completed') {
          modified++;
          links.push(res.path);
        }
      };
    }
  }, 1000);
};

const getStatusBar = function (filename, index) {
  console.log(filename, index);
  const status = document.createElement('p');
  status.id = `file-${index}`;
  status.innerText = `${filename} - waiting`;
  return status;
};

const sendForm = function (form) {
  form.addEventListener('submit', () => {
    event.preventDefault();
    const upload = document.getElementById('upload');
    const newForm = new FormData(form);
    const fileNames = Array.from(upload.files).map((f) => f.name);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/edit');
    xhr.send(newForm);
    xhr.onload = function () {
      const id = JSON.parse(event.target.response);
      for (let i in id.id) {
        const status = getStatusBar(fileNames[i], i);
        document.getElementById('status').appendChild(status);
      }
      document.getElementById('status').style.display = 'block';
      wait(id.id, fileNames);
    };
  });
};

window.onload = function () {
  const form = document.getElementById('image');
  const option = document.getElementById('edit');
  optionChange(option);
  sendForm(form);
};
