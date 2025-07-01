const express = require("express");
const app = express();
const router = express.Router();
const sequelize = require("../database");
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
const { Limiter } = require('../functions')
const bcrypt = require("bcrypt");


const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Token valide : on attache les infos à la requête
        req.user = decoded;
        req.log?.info({ userId: decoded.id }, 'JWT verified successfully');
        next(); // on passe à la route suivante
    } catch (err) {
        // Gestion des erreurs
        req.log?.warn({ err }, 'JWT verification failed');
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Erreur inattendue
        return res.status(500).json({ error: 'Token verification failed' });
    }
};


app.use('/api', router);

router.get('/about', (req, res) => {
    res.send('About this app');
});

// Users routes


router.get('/get_salt', verifyToken , async (req, res) => {  
  const token = req.cookies.token;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const id = decoded.id;
    req.log.info({ userId: decoded.id }, 'Fetching user salt');
    const response = await sequelize.query(
      'SELECT salt FROM rrpm_user WHERE id = :id',
      { replacements: {id} }
    );
    
    if (!response[0] || response[0].length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(response[0]);
  } catch (error) {
    req.log.warn({ userId: decoded.id }, 'User not found for /get_salt');
    console.error('Error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// router.delete('/delete', verifyToken , async (req, res) => {

// });


// Master password route

// utiliser cette route dans le front

router.put('/master/password', verifyToken, Limiter, async (req, res) => {
  const id = req.user.id;
  const { oldPassword, newPassword } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old and new passwords are required' });
  }

  try {
    // Step 1: Fetch current hashed password
    const [user] = await sequelize.query(
      'SELECT hashed_master_password FROM rrpm_user WHERE id = :id',
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 2: Compare old password with hash
    const isMatch = await bcrypt.compare(oldPassword, user.hashed_master_password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    // Step 3: Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Step 4: Update password in DB
    await sequelize.query(
      'UPDATE rrpm_user SET hashed_master_password = :password WHERE id = :id',
      {
        replacements: { password: hashedNewPassword, id },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/// ciphered passwords

router.post('/ciphered/password', verifyToken, Limiter, async (req, res) => { 
    const { name, password, description, url } = req.body;
    const token = req.cookies.token;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const id = decoded.id;
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

        req.log.info({
            userId: id,
            action: 'create-password',
            name,
        }, 'Creating new ciphered password entry');

        const response = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
        });

        res.json(response);
    } catch (error) {
        req.log.error({ err: error, userId: id }, 'Failed to create ciphered password');
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/ciphered/password', verifyToken, async (req, res) => { 
    const id = req.user.id; // récupéré depuis le token vérifié par le middleware

    if (!id) {
        return res.status(404).json({ error: 'User id not found in request' });
    }

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

router.delete('/ciphered/password/:id', verifyToken, Limiter, async (req, res) => { 
  const { id } = req.params;
  const userId = req.user.id;
  req.log.info({ userId, passwordId: id }, 'Password deletion requested');

  try {
    // 1. Check if the password belongs to the user
    const existing = await sequelize.query(
      'SELECT id FROM cipher_passwords WHERE id = :id AND user_id = :userId',
      {
        replacements: { id, userId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existing.length === 0) {
      req.log.warn({ userId, passwordId: id }, 'Password not found or not owned by user');
      return res.status(404).json({ error: 'Password not found or not owned by user' });
    }

    // 2. Perform the delete
    await sequelize.query(
      'DELETE FROM cipher_passwords WHERE id = :id AND user_id = :userId',
      {
        replacements: { id, userId },
        type: sequelize.QueryTypes.DELETE
      }
    );

    // Optional: log the deletion
    req.log.info({ userId, passwordId: id }, 'Password successfully deleted');
    res.json({ message: 'Password deleted successfully' });

  } catch (error) {
    console.error('Error deleting password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/ciphered/password/:id', verifyToken, Limiter, async (req, res) => { 
    const { id } = req.params;
    const userId = req.user.id;
    const { name, password, description, url } = req.body;
    req.log.info({ userId, passwordId: id }, 'Attempting to update ciphered password');


    try {
        const existing = await sequelize.query(
            'SELECT id FROM cipher_passwords WHERE id = :id AND user_id = :userId',
            {
                replacements: { id, userId },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Password not found or not owned by user' });
        }

        let query = 'UPDATE cipher_passwords SET value = :password';
        let replacements = { password, id };

        if (name) {
            query += ', name = :name';
            replacements.name = name;
        }

        if (description) {
            query += ', description = :description';
            replacements.description = description;
        }

        if (url) {
            query += ', url = :url';
            replacements.url = url;
        }

        query += ' WHERE id = :id';

        const [result] = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.UPDATE
        });

        if (result === 0) {
            return res.status(200).json({ message: 'No changes applied (data may be identical)' });
        }

        res.json({ message: 'Password updated successfully' });
        req.log.info({ userId, passwordId: id }, 'Ciphered password updated successfully');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router; 