const express = require("express");
const app = express();
const router = express.Router();
const sequelize = require("../database");

app.use('/api', router);

router.get('/about', (req, res) => {
    res.send('About this app');
});

router.get('/all_users', async (req, res) => {
    try {
        const response = await sequelize.query(
          `SELECT * FROM rrpm_user`
        );
        res.json(response[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

module.exports = router; 