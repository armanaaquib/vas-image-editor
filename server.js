const express = require('express');
const fileUpload = require('express-fileupload');
const qs = require('querystring');
const redis = require('redis');

const app = express();
const client = redis.createClient({ db: 1 });
let job_id = 1;

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.post('/edit', (req, res) => {
  req.files.file.forEach(file => {
    const data = {
      filename: file.name,
      data: file.data
    }
    const request = https.request(fsOptions, (res) => {
      const job_id = job_id++;
      res.on('data', data => console.log(data.toString()));
      client.hmset(`JOB_${job_id}`, ["pushed_at", new Date(), "operation", req.body.operation, "status", "in_queue", "original_file", res.body.name]);
      client.rpush("jobs", `JOB_${job_id}`);
    });
    request.write(qs.stringify(data));
    request.end();
  });
});

app.listen(7777);
