const express = require('express');
const fileUpload = require('express-fileupload');
const http = require('http');
const redis = require('redis');

const app = express();
const client = redis.createClient({ db: 1 });
let current_job_id = 1;

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

const fsOptions = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/save',
  method: 'POST',
};

const getOperationValues = function (operation, params) {
  if (operation == 'resize') {
    return ['height', params['height'], 'width', params['width']]
  } else {
    return ['angle', params['angle']];
  }
};

const sendRequest = function (file, params) {
  const job_id = current_job_id++;
  const options = {
    ...fsOptions,
    headers: {
      'Content-Type': file.mimetype,
    },
  };

  const request = http.request(options, (res) => {
    res.on('data', (data) => {
      const fieldValues = [
        'pushedAt',
        JSON.stringify(new Date()),
        'status',
        'inQueue',
        'fileName',
        data.toString(),
        ...getOperationValues(params.operation, params)
      ];

      client.hmset(`job_${job_id}`, fieldValues, () => {
        client.rpush(`${params.operation.toLowerCase()}Queue`, `job_${job_id}`);
      });
    });
  });

  request.end(file.data);
  return job_id;
};

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.static('public'));

app.post('/edit', (req, res) => {
  const response = { id: [] };
  req.files.file = [].concat(req.files.file);
  req.files.file.forEach((file) => {
    if (/image/.test(file.mimetype)) {
      const job_id = sendRequest(file, req.body);
      response.id.push(job_id);
    }
  });
  res.end(JSON.stringify(response));
});

app.get('/status/:jobId', (req, res) => {
  const id = req.params.jobId;
  client.hget(`job_${id}`, 'status', (err, status) => {
    let path = '127.0.0.1:5000/';

    if (status == 'completed') {
      client.hget(`job_${id}`, 'resultedFileName', (err, file_name) => {
        path += file_name;
        res.end(JSON.stringify({ status, path }));
      });
    } else {
      res.end(JSON.stringify({ status, path }));
    }
  });
});

module.exports = app;
