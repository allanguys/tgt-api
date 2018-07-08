const os = require('os');
const express = require('express');
const logger = require('morgan');
const router = require('./app/router');
const config = require('./config');

const app = express();
app.disable('x-powered-by');
app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(`${__dirname}/static`, { immutable: true, maxAge: '1d' }));
app.use((req, res, next) => {
  res.set('X-Hit-Backend', os.hostname);
  next();
});
app.use(router);

process.on('unhandledRejection', (reason, p) => {
  // eslint-disable-next-line
  console.error('未处理的 rejection：', p, '原因：', reason);
});

const port = process.env.PORT || config.port;
const host = process.env.HOST || config.host;

app.listen(port, host, () => {
  // eslint-disable-next-line
  console.log(`Server running at http://${host}:${port}`);
});
