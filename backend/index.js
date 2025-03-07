const express = require('express');
const app = express();
const PORT = 3001;
router = require('./routes/api')
const auth = require('./routes/auth');
const sequelize = require('./database');
// const bodyParser = require('body-parser');

// Middleware to parse JSON
app.use(express.json());


app.use('/api',router)
app.use('/auth', auth);

app.get('/login', (req,res) => {

});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
