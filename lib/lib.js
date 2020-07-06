const http = require('http');

const fsOptions = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/save',
  method: 'POST',
};

const getOperationValues = function (params) {
  const { operation } = params;
  let values = ['angle', params['angle']];
  if (operation == 'resize') {
    values = ['height', params['height'], 'width', params['width']];
  }
  return values;
};

const getJobId = function (client) {
  return new Promise((resolve, reject) => {
    client.incr('job_id', (err, out) => {
      if (err) {
        reject(err);
      } else {
        resolve(out);
      }
    });
  });
};

const getJobDetails = function (data, params) {
  return [
    'receivedAt',
    JSON.stringify(new Date()),
    'status',
    'inQueue',
    'fileName',
    data.toString(),
    ...getOperationValues(params),
  ];
};

const sendRequest = function (file, params, redisClient) {
  return new Promise((resolve, reject) => {
    getJobId(redisClient)
      .then((job_id) => {
        let data = '';
        const request = http.request(fsOptions, (res) => {
          res.on('data', (chunk) => (data += chunk));

          res.on('end', () => {
            const fieldValues = getJobDetails(data, params);
            redisClient.hmset(`job_${job_id}`, fieldValues, () => {
              redisClient.rpush(`${params.operation.toLowerCase()}Queue`, `job_${job_id}`, () => {
                resolve(job_id);
              });
            });
          });
        });
        request.setHeader('Content-type', file.mimetype);
        request.end(file.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = {
  sendRequest,
};
