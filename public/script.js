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
  document.getElementById('waiting').firstElementChild.remove();
  for (each in links) {
    const link = document.createElement('a');
    link.href = `http://${links[each]}`;
    link.innerText = `${fileNames[each]} => Download`;
    document.getElementById('waiting').appendChild(link);
    document
      .getElementById('waiting')
      .appendChild(document.createElement('br'));
  }
};

const wait = function (id, fileNames) {
  document.getElementById('waiting').style.display = 'block';
  document.getElementById('image').style.display = 'none';
  let modified = 0,
    links = [];
  const interval = setInterval(() => {
    if (modified == id.length) {
      clearInterval(interval);
      download(links, fileNames);
    }
    for (let i of id) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/status/${i}`);
      xhr.send();
      xhr.onload = function () {
        const res = JSON.parse(event.target.response);
        if (res.status == 'completed') {
          modified++;
          links.push(res.path);
        }
      };
    }
  }, 1000);
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
