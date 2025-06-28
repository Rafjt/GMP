const express = require('express');
const app = express();
const PORT = 2111;
router = require('./routes/api')
const auth = require('./routes/auth');
const sequelize = require('./database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
// const bodyParser = require('body-parser');
app.use(helmet());
// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());
// OG
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, false);

//     // Allow Chrome Extensions and maybe localhost during dev
//     if (origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost')) {
//       return callback(null, true);
//     }

//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE']
// })); 

// REVAMP
const allowedPrefix = 'chrome-extension://';

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, false); // Block requests with no Origin header
    if (origin.startsWith(allowedPrefix)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));



app.use((req, res, next) => {
  console.log('----- Incoming Request -----');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});


app.use('/api',router)
app.use('/auth', auth);

// app.get('/login', (req,res) => {

// });

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});