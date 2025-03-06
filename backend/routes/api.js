const express = require("express");
const app = express();
const router = express.Router();
const sequelize = require("../database");

app.use('/api', router);

router.get('/about', (req, res) => {
    res.send('About this app');
});

router.get('/all_user', async (req, res) => {
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

router.put('/master/password/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        const response = await sequelize.query(
            'UPDATE rrpm_user SET hashed_master_password = :password WHERE id = :id',
            {
                replacements: { password, id },
                type: sequelize.QueryTypes.UPDATE
            }
        );
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 