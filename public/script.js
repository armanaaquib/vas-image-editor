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

const getDownloadLink = function (link, fileName) {
  return `<a href="http://${link}"> ${fileName} - Download </a>`;
};

const wait = function (id, fileNames) {
  document.getElementById('image').style.display = 'none';
  let modified = 0;
  const interval = setInterval(() => {
    if (modified == id.length) {
      clearInterval(interval);
    }
    for (let i in id) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/status/${id[i]}`);
      xhr.send();
      xhr.onload = function () {
        const res = JSON.parse(event.target.response);
        document.getElementById(
          `file-${i}`
        ).innerText = `${fileNames[i]} - ${res.status}`;
        if (res.status == 'completed') {
          document.getElementById(`file-${i}`).innerHTML = getDownloadLink(
            res.path,
            fileNames[i]
          );
          modified++;
        }
      };
    }
  }, 1000);
};

const getStatusBar = function (filename, index) {
  const status = document.createElement('p');
  status.id = `file-${index}`;
  status.innerText = `${filename} - please wait`;
  return status;
};

const sendForm = function (form) {
  form.addEventListener('submit', () => {
    event.preventDefault(false);
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
