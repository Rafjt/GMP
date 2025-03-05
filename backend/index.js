const express = require('express');
const app = express();
const PORT = 3001;
router = require('./routes/api')
const sequelize = require('./database');
// const bodyParser = require('body-parser');

// Middleware to parse JSON
app.use(express.json());

// app.use(bodyParser.json());

// Basic Route
// app.get('/', (req, res) => {
//     res.send('Welcome to the REST API!');
// });

app.use('/api',router)

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
