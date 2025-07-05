const express = require("express");
const sequelize = require("../database");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { QueryTypes } = require("sequelize");
const { Limiter } = require('../functions')

const SECRET_KEY = process.env.JWT_SECRET;
const TOTP_MASTER_KEY = process.env.TOTP_MASTER_KEY;

// Vérification du token JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Token verification failed" });
  }
};

// Fonction de chiffrement AES-256-GCM
function encrypt(text, key) {
  const iv = crypto.randomBytes(12); // IV recommandé : 12 octets pour GCM
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("Invalid key length. Expected 32 bytes for AES-256-GCM");
  }

  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  });
}


function decrypt(encryptedData, key) {
  const { iv, content, tag } = JSON.parse(encryptedData);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("Invalid key length. Expected 32 bytes for AES-256-GCM");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}


// Route : vérifier si 2FA activé
router.get("/isEnabled", verifyToken, Limiter, async (req, res) => {
  const id = req.user.id;

  if (!id) {
    return res.status(404).json({ error: "User id not found in request" });
  }

  try {
    const response = await sequelize.query(
      "SELECT enabled FROM user_2fa WHERE user_id = :id",
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    );
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route : activer 2FA
router.post("/enable", verifyToken, Limiter, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Utilisateur connecté :", req.user);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const secret = speakeasy.generateSecret({
      name: `Rrpm (${req.user.login})`,
    });

    console.log("Secret généré :", secret);
    console.log("Clé de chiffrement maître :", TOTP_MASTER_KEY);

    const encryptedSecret = encrypt(secret.base32, TOTP_MASTER_KEY);
    await sequelize.query(
      "UPDATE user_2fa SET ciphered_secret_TOTP = ?, enabled = 1 WHERE user_id = ?",
      {
        replacements: [encryptedSecret, userId],
        type: QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "2FA activé. Scanne le QR Code.",
      otpauth_url: secret.otpauth_url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Route : désactiver 2FA
router.post("/disable", verifyToken, Limiter, async (req, res) => {
  const id = req.user.id;

  if (!id) {
    return res.status(404).json({ error: "User id not found in request" });
  }

  try {
    await sequelize.query(
      "UPDATE user_2fa SET enabled = 0 WHERE user_id = :id",
      {
        replacements: { id },
        type: QueryTypes.UPDATE,
      }
    );
    res.json({ success: true, message: "2FA désactivé avec succès" });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/verify-2fa', async (req, res) => {
  const { userId, code } = req.body;

  const [result] = await sequelize.query(
    "SELECT ciphered_secret_TOTP FROM user_2fa WHERE user_id = :id",
    {
      replacements: { id: userId },
      type: QueryTypes.SELECT,
    }
  );

  if (!result) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Déchiffrer la clé secrète :
  const decrypted = decrypt(result.ciphered_secret_TOTP, TOTP_MASTER_KEY);
  
  const verified = speakeasy.totp.verify({
    secret: decrypted,
    encoding: 'base32',
    token: code,
  });

  if (verified) {
    // 2FA validé → générer token JWT + login réussi
    const token = jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: "1h" });
    res.cookie("token", token, { 
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    });
    res.json({ success: true, message: '2FA validated, login successful' });
  } else {
    res.status(400).json({ success: false, error: 'Invalid 2FA code' });
  }
});


module.exports = router;
