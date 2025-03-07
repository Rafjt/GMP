const express = require("express");
const sequelize = require("../database");
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/about', (req, res) => {
    res.send('About this app');
});

// app.post('/login', (req,res) => {

//     // const username = req.body.username;
//     // const password = req.body.password;
// });

module.exports = router;