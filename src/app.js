const express = require('express');
const fileUpload = require('express-fileupload');
const redis = require('redis');
const { sendRequest } = require('../lib/lib.js')

const app = express();
const client = redis.createClient({ db: 1 });

client.setnx('job_id', 1, (err, out) => {
  if (err) {
    console.log("error: connecting to redis");
    exit(1);
  }
});

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.static('public'));

app.post('/edit', async function (req, res) {
  const response = { id: [] };
  req.files.file = [].concat(req.files.file);
  for (file of req.files.file) {
    if (/image/.test(file.mimetype)) {
      const job_id = await sendRequest(file, req.body, client);
      response.id.push(job_id);
    }
  };
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
