const express = require("express");
const app = express();
const router = express.Router();
const sequelize = require("../database");

app.use('/api', router);

router.get('/about', (req, res) => {
    res.send('About this app');
});

// Users routes

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

// Master password route

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


/// ciphered passwords

router.post('/ciphered/password', async (req, res) => {
    const { id, name, password, description, url } = req.body;

    try {
        let query = 'INSERT INTO cipher_passwords (user_id, name, value';
        let values = 'VALUES (:id, :name, :password';
        let replacements = { id, name, password };

        if (description) {
            query += ', description';
            values += ', :description';
            replacements.description = description;
        }

        if (url) {
            query += ', url';
            values += ', :url';
            replacements.url = url;
        }

        query += ') ';
        values += ')';
        query += values;

        const response = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
        });

        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/ciphered/password/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await sequelize.query(
            'SELECT * FROM cipher_passwords WHERE user_id = :id',
            {
                replacements: { id },
                type: sequelize.QueryTypes.SELECT
            }
        );
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/ciphered/password/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await sequelize.query(
            'DELETE FROM cipher_passwords WHERE id = :id',
            {
                replacements: { id },
                type: sequelize.QueryTypes.DELETE
            }
        );
        res.json({ message: 'Password deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/ciphered/password/:id', async (req, res) => {
    const { id } = req.params;
    const { name, password } = req.body;

    try {
        let query = 'UPDATE cipher_passwords SET value = :password';
        let replacements = { password, id };

        if (name) {
            query += ', name = :name';
            replacements.name = name;
        }

        query += ' WHERE id = :id';

        const response = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.UPDATE
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 