const express = require("express");
const sequelize = require("../database");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const sendMail = require("../mailer");
const { QueryTypes } = require("sequelize");
const { Limiter } = require('../functions')
const validator = require("validator");
const SECRET_KEY = process.env.JWT_SECRET;

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
        req.log?.warn({ err }, 'JWT verification failed');
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(500).json({ error: 'Token verification failed' });
    }
};

router.post("/register", Limiter, async (req, res) => {
  const { email, password } = req.body;
  req.log?.info({ email }, 'Register attempt');

  if (!email || !password) {
    req.log?.warn({ email }, 'Missing email or password');
    return res.status(400).json({ error: "Email and hashed password are required." });
  }

  if (!validator.isEmail(email)) {
    req.log?.warn({ email }, 'Invalid email format');
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const existingUser = await sequelize.query(
      "SELECT id FROM rrpm_user WHERE login = :email",
      { replacements: { email }, type: sequelize.QueryTypes.SELECT }
    );

    if (existingUser.length > 0) {
      req.log?.warn({ email }, 'Email already registered');
      return res.status(409).json({ error: "Email already registered." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await sequelize.query(
      `INSERT INTO rrpm_user 
        (login, hashed_master_password, is_verified, verification_token) 
       VALUES 
        (:email, :password, FALSE, :verificationToken);`,
      {
        replacements: { email, password, verificationToken },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    req.log?.info({ email }, 'User registered, verification email sent');

    const verificationLink = `https://rrpm.site/auth/verify-email?token=${verificationToken}`;
    const html = `<div style="font-family: Arial, sans-serif; text-align: center;">
    <h2>Welcome to RRPM 👋</h2>
    <p>Click the button below to verify your email address:</p>
    <a href="${verificationLink}" 
       style="
         display: inline-block;
         padding: 12px 20px;
         margin-top: 10px;
         font-size: 16px;
         font-weight: bold;
         color: white;
         background-color: #007BFF;
         border-radius: 6px;
         text-decoration: none;
       ">
      Verify Email
    </a>
  </div>`;
    await sendMail(
      email,
      "Verify Your Email",
      `Click the link: ${verificationLink}`,
      html
    );

    return res.status(201).json({
      message: "User registered. Please verify your email before logging in.",
    });
  } catch (error) {
    req.log?.error({ err: error, email }, 'Error during registration');
    return res.status(500).json({ error: "Internal server error" });
  }
});

function renderPage(message, isError = false) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Email Verification</title><style>body {font-family: system-ui, sans-serif;background: ${isError ? "#ffe6e6" : "#f0fdf4"};color: ${isError ? "#991b1b" : "#065f46"};display: flex;align-items: center;justify-content: center;height: 100vh;margin: 0;padding: 1rem;} .container {text-align: center;background: white;padding: 2rem;border-radius: 1rem;box-shadow: 0 10px 20px rgba(0,0,0,0.1);max-width: 400px;width: 100%;} h1 {font-size: 1.5rem;margin-bottom: 1rem;} p {font-size: 1rem;} .success {color: #16a34a;} .error {color: #dc2626;}</style></head><body><div class="container"><h1 class="${isError ? "error" : "success"}">${message}</h1></div></body></html>`;
}

router.get("/verify-email", Limiter, async (req, res) => {
  const { token } = req.query;
  req.log?.info({ token }, 'Email verification attempt');

  if (!token || typeof token !== "string" || token.length < 32) {
    req.log?.warn({ token }, 'Invalid token in email verification');
    return res.status(400).send(renderPage("Invalid or missing verification token", true));
  }

  try {
    const [user] = await sequelize.query(
      `SELECT id, is_verified FROM rrpm_user WHERE verification_token = :token;`,
      { replacements: { token }, type: sequelize.QueryTypes.SELECT }
    );

    if (!user) {
      req.log?.warn({ token }, 'Token not found or expired');
      return res.status(400).send(renderPage("Invalid or expired verification token", true));
    }

    if (user.is_verified) {
      req.log?.info({ userId: user.id }, 'User already verified');
      return res.status(200).send(renderPage("✅ Email already verified. You can now log in."));
    }

    const salt = crypto.randomBytes(16).toString("base64");
    await sequelize.query(
      `UPDATE rrpm_user SET is_verified = TRUE, verification_token = NULL, salt = :salt WHERE id = :id;`,
      { replacements: { id: user.id, salt }, type: sequelize.QueryTypes.UPDATE }
    );

    // 🟢 Crée l'entrée 2FA pour l'utilisateur (enabled à 0)
    await sequelize.query(
      `INSERT IGNORE INTO user_2fa (user_id, enabled, ciphered_secret_totp) 
      VALUES (:id, 0, '')`,
      { replacements: { id: user.id }, type: sequelize.QueryTypes.INSERT }
    );


    req.log?.info({ userId: user.id }, 'Email verified and 2FA entry created');
    return res.send(renderPage("✅ Email verified successfully. You can now log in."));
  } catch (error) {
    req.log?.error({ err: error }, 'Error during email verification');
    return res.status(500).send(renderPage("Internal server error", true));
  }
});



router.post("/login", Limiter, async (req, res) => {
  const { email, password } = req.body;
  req.log?.info({ email }, 'Login attempt');

  if (!email || !password) {
    req.log?.warn({ email }, 'Missing email or password during login');
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await sequelize.query(
      "SELECT id, login, hashed_master_password, is_verified FROM rrpm_user WHERE login = ?",
      { replacements: [email], type: QueryTypes.SELECT }
    );

    if (user.length === 0) {
      req.log?.warn({ email }, 'Invalid login credentials (no such user)');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { id, login, hashed_master_password, is_verified } = user[0];

    if (!is_verified) {
      req.log?.warn({ userId: id, email }, 'Login blocked - account not verified');
      return res.status(403).json({ message: "Account not verified" });
    }

    const isMatch = await bcrypt.compare(password, hashed_master_password);
    if (!isMatch) {
      req.log?.warn({ userId: id, email }, 'Invalid password attempt');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Vérifier si le 2FA est activé
    const [twoFaResult] = await sequelize.query(
      "SELECT enabled FROM user_2fa WHERE user_id = ?",
      { replacements: [id], type: QueryTypes.SELECT }
    );

    if (twoFaResult && twoFaResult.enabled) {
      // 2FA requis → demande de code TOTP
      return res.json({ message: "2FA required", twoFactorRequired: true, userId: id });
    }

    // Pas de 2FA → connexion immédiate
    const token = jwt.sign({ id, login }, SECRET_KEY, { expiresIn: "1h" });

    req.log?.info({ userId: id }, 'Login successful');
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    req.log?.error({ email, err: error }, 'Login error');
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/me', verifyToken, (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    req.log?.info('Token not provided in /me');
    return res.status(401).json({ authenticated: false });
  }

  jwt.verify(token, SECRET_KEY, (err) => {
    if (err) {
      req.log?.warn({ err }, 'Invalid token in /me');
      return res.status(401).json({ authenticated: false });
    }

    req.log?.info('Token verified for /me');
    res.json({ authenticated: true });
  });
});

router.post('/logout', (req, res) => {
  req.log?.info('Logout called');
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  res.setHeader('X-Debug-Logout', 'Token cookie cleared');
  res.json({ message: 'Logged out' });
});

router.delete("/deleteAccount", verifyToken, Limiter, async (req, res) => {
  const id = req.user.id;

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing' });
  }

  try {
    const result = await sequelize.query(
      'DELETE FROM rrpm_user WHERE id = :id',
      {
        replacements: { id },
        type: sequelize.QueryTypes.DELETE,
      }
    );

    res.clearCookie('token');
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/request-password-reset", Limiter, async (req, res) => {
  const { email } = req.body;
  req.log?.info({ email }, "Password reset request");

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: "Valid email is required." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  try {
    const user = await sequelize.query(
      "SELECT id FROM rrpm_user WHERE login = :email",
      { replacements: { email }, type: sequelize.QueryTypes.SELECT }
    );

    if (user.length === 0) {
      req.log?.warn({ email }, "Email not found");
      return res.status(404).json({ error: "Email not found." });
    }

    await sequelize.query(
      `UPDATE rrpm_user SET reset_token = :resetToken, reset_token_expiry = NOW() + INTERVAL 1 HOUR WHERE login = :email`,
      { replacements: { email, resetToken }, type: sequelize.QueryTypes.UPDATE }
    );

    const deleteLink = `http://localhost:2111/auth/deleteAccount/${resetToken}`;
    const html = `<div style="font-family: Arial, sans-serif; text-align: center;">
      <h2>Delete Your RRPM Account ⚠️</h2>
      <p>This action is irreversible. Click below to permanently delete your account:</p>
      <a href="${deleteLink}" style="display: inline-block; padding: 12px 20px; font-size: 16px; font-weight: bold; color: white; background-color: #dc3545; border-radius: 6px; text-decoration: none;">Delete Account</a>
    </div>`;

    await sendMail(
      email,
      "Delete Your RRPM Account",
      `Delete link: ${deleteLink}`,
      html
    );

    res.json({ message: "Delete link sent if the email is registered." });
  } catch (err) {
    req.log?.error({ err, email }, "Error sending reset link");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/deleteAccount/:token", Limiter, async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    return res.status(400).send(renderPage("Invalid or missing token.", true));
  }

  try {
    const user = await sequelize.query(
      `SELECT id FROM rrpm_user 
       WHERE reset_token = :token 
       AND reset_token_expiry > NOW()`,
      {
        replacements: { token },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (user.length === 0) {
      return res
        .status(400)
        .send(
          renderPage("This account deletion link is invalid or expired.", true)
        );
    }

    const userId = user[0].id;

    await sequelize.query(
      `UPDATE rrpm_user SET reset_token = NULL, reset_token_expiry = NULL WHERE id = :id`,
      { replacements: { id: userId }, type: sequelize.QueryTypes.UPDATE }
    );

    // Delete user, cascades to cipher_passwords and user_2fa
    await sequelize.query(`DELETE FROM rrpm_user WHERE id = :id`, {
      replacements: { id: userId },
      type: sequelize.QueryTypes.DELETE,
    });

    return res
      .status(200)
      .send(renderPage("Your account has been permanently deleted."));
  } catch (error) {
    console.error("Error during token-based account deletion:", error);
    return res
      .status(500)
      .send(renderPage("An internal server error occurred.", true));
  }
});

module.exports = router;
