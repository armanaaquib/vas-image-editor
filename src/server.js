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

const sendRequest = function (file, operation) {
  const job_id = current_job_id++;
  const request = http.request(
    {
      ...fsOptions,
      headers: {
        'Content-type': file.mimetype,
      },
    },
    (res) => {
      res.on('data', (data) => {
        const fieldValues = [
          'pushed_at',
          new Date(),
          'status',
          'in_queue',
          'file_name',
          data.toString(),
        ];

        client.hmset(`JOB_${job_id}`, fieldValues, () => {
          client.rpush('resize_queue', `JOB_${job_id}`);
        });
      });
    }
  );

  request.end(file.data);
  return job_id;
};

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

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
  client.hget(`JOB_${id}`, 'status', (err, out) => {
    (status = out), (path = null);
    if (out == 'completed') {
      client.hget(`JOB_${id}`, 'modified_name', (err, path) => {
        res.end(JSON.stringify({ status: out, path }));
      });
    } else {
      res.end(JSON.stringify({ status, path }));
    }
  });
});

app.listen(8000);
