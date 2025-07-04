const express = require("express");
const sequelize = require("../database");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sendMail = require("../mailer");
const { QueryTypes } = require("sequelize");
const { Limiter } = require('../functions')
const validator = require("validator");
const SECRET_KEY = process.env.JWT_SECRET;
const TOTP_MASTER_KEY= process.env.TOTP_MASTER_KEY


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


router.get('/isEnabled', verifyToken, async (req, res) => { 
    const id = req.user.id;

    if (!id) {
        return res.status(404).json({ error: 'User id not found in request' });
    }

    try {
        const response = await sequelize.query(
            'SELECT enabled FROM user_2fa WHERE user_id = :id',
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

router.post('/enable', verifyToken, async (req, res) => {
    const id = req.user.id;

    if (!id) {
        return res.status(404).json({ error: 'User id not found in request' });
    }

    try {
        await sequelize.query(
            'UPDATE user_2fa SET enabled = 1 WHERE user_id = :id',
            {
                replacements: { id },
                type: QueryTypes.UPDATE
            }
        );
        res.json({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/disable', verifyToken, async (req, res) => {
    const id = req.user.id;

    if (!id) {
        return res.status(404).json({ error: 'User id not found in request' });
    }

    try {
        await sequelize.query(
            'UPDATE user_2fa SET enabled = 0 WHERE user_id = :id',
            {
                replacements: { id },
                type: QueryTypes.UPDATE
            }
        );
        res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router; 