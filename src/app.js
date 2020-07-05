const express = require('express');
const fileUpload = require('express-fileupload');
const http = require('http');
const redis = require('redis');

const app = express();
const client = redis.createClient({ db: 1 });

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

const fsOptions = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/save',
  method: 'POST',
};

const sendRequest = function (file, operation) {
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
        'pushed_at',
        JSON.stringify(new Date()),
        'status',
        'in_queue',
        'file_name',
        data.toString(),
      ];

      client.hmset(`job_${job_id}`, fieldValues, () => {
        client.rpush(`${operation.toLowerCase()}_queue`, `job_${job_id}`);
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
      const job_id = sendRequest(file, req.body.operation);
      response.id.push(job_id);
    }
  });
  res.end(JSON.stringify(response));
});

app.get('/status/:job_id', (req, res) => {
  const id = req.params.job_id;
  client.hget(`job_${id}`, 'status', (err, status) => {
    let path = '127.0.0.1:5000/';

    if (status == 'completed') {
      client.hget(`job_${id}`, 'resulted_fileName', (err, file_name) => {
        path += file_name;
        res.end(JSON.stringify({ status, path }));
      });
    } else {
      res.end(JSON.stringify({ status, path }));
    }
  });
});

module.exports = app;
