const express = require("express");
const sequelize = require("../database");
const router = express.Router();

router.get('/about', (req, res) => {
    res.send('About this app');
});

module.exports = router;