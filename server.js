const app = require('./src/app');

const main = (port) => {
  const PORT = port || 8000;
  app.listen(PORT, () => console.log(`listening Server: at ${PORT}`));
};

main(+process.argv[2]);
