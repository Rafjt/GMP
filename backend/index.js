const express = require('express');
const app = express();
const PORT = 2111;
router = require('./routes/api')
const auth = require('./routes/auth');
const sequelize = require('./database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./logger');
// const bodyParser = require('body-parser');

// Version test postman
const allowedPrefix = 'chrome-extension://';

app.use(cors({
  origin: function (origin, callback) {
    // Postman and server-to-server requests
    if (!origin) return callback(null, true);

    // Allow Chrome extension
    if (origin.startsWith(allowedPrefix)) {
      return callback(null, true);
    }

    // You can whitelist more origins here if needed
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));


app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// PROD
// const allowedPrefix = 'chrome-extension://';

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, false); // Block requests with no Origin header
//     if (origin.startsWith(allowedPrefix)) {
//       return callback(null, true);
//     }
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE']
// }));



// app.use((req, res, next) => {
//   console.log('----- Incoming Request -----');
//   console.log('Origin:', req.headers.origin);
//   console.log('Method:', req.method);
//   console.log('URL:', req.originalUrl);
//   console.log('Headers:', req.headers);
//   console.log('Body:', req.body);
//   next();
// });

app.use(pinoHttp({ logger }));
app.use('/api',router)
app.use('/auth', auth);

// app.get('/login', (req,res) => {

// });

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});