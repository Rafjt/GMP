// logger.js
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.body.password',
    'req.body.token',
    '*.secret'
  ],
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: true
        }
      }
    : {
        target: 'pino/file',
        options: {
          destination: './logs/app.log',
          mkdir: true // crée automatiquement le dossier
        }
      }
});

module.exports = logger;
