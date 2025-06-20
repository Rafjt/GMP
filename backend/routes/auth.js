const express = require("express");
const sequelize = require("../database");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const sendMail = require("../mailer");
const { QueryTypes } = require("sequelize");
const verifyToken = require('./api')
const { Limiter } = require('../functions')
const validator = require("validator");
const SECRET_KEY = process.env.JWT_SECRET;

router.get("/about", (req, res) => {
  res.send("About this app");
});

router.post("/register", Limiter, async (req, res) => {
  console.log("-- DEBUG : REGISTER HAS BEEN CALLED --");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and hashed password are required." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Vérifie si un utilisateur avec cet email existe déjà
    const existingUser = await sequelize.query(
      "SELECT id FROM rrpm_user WHERE login = :email",
      {
        replacements: { email },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await sequelize.query(
      `INSERT INTO rrpm_user 
        (login, hashed_master_password, is_verified, verification_token) 
       VALUES 
        (:email, :password, FALSE, :verificationToken);`,
      {
        replacements: {
          email,
          password,
          verificationToken,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    // Remplace par le domaine réel de ton API
    const verificationLink = `http://51.210.151.154:2111/auth/verify-email?token=${verificationToken}`;

    await sendMail(
      email,
      "Verify Your Email",
      `Click the link to verify your email: ${verificationLink}`
    );

    return res.status(201).json({
      message: "User registered. Please verify your email before logging in.",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Utility function to render a simple styled HTML page
function renderPage(message, isError = false) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email Verification</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        background: ${isError ? "#ffe6e6" : "#f0fdf4"};
        color: ${isError ? "#991b1b" : "#065f46"};
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        padding: 1rem;
      }
      .container {
        text-align: center;
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        max-width: 400px;
        width: 100%;
      }
      h1 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
      p {
        font-size: 1rem;
      }
      .success {
        color: #16a34a;
      }
      .error {
        color: #dc2626;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="${isError ? "error" : "success"}">${message}</h1>
    </div>
  </body>
  </html>
  `;
}

router.get("/verify-email", Limiter, async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string" || token.length < 32) {
    return res.status(400).send(renderPage("Invalid or missing verification token", true));
  }

  try {
    const [user] = await sequelize.query(
      `SELECT id, is_verified FROM rrpm_user WHERE verification_token = :token;`,
      {
        replacements: { token },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!user) {
      return res
        .status(400)
        .send(renderPage("Invalid or expired verification token", true));
    }

    if (user.is_verified) {
      return res
        .status(200)
        .send(renderPage("✅ Email already verified. You can now log in."));
    }

    const salt = crypto.randomBytes(16).toString("base64"); // ou 'hex' si utilisé côté front

    await sequelize.query(
      `UPDATE rrpm_user
       SET is_verified = TRUE,
           verification_token = NULL,
           salt = :salt
       WHERE id = :id;`,
      {
        replacements: { id: user.id, salt },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    return res.send(renderPage("✅ Email verified successfully. You can now log in."));
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).send(renderPage("Internal server error", true));
  }
});


router.post("/login", Limiter, async (req, res) => {
  const { email, password } = req.body;

  // Vérification des champs
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await sequelize.query(
      "SELECT id, login, hashed_master_password, is_verified FROM rrpm_user WHERE login = ?",
      {
        replacements: [email],
        type: QueryTypes.SELECT,
      }
    );

    if (user.length === 0) {
      // On ne précise pas si c’est l’email ou le mdp
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { id, login, hashed_master_password, is_verified } = user[0];

    if (!is_verified) {
      return res.status(403).json({ message: "Account not verified" });
    }

    const isMatch = await bcrypt.compare(password, hashed_master_password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id, login }, SECRET_KEY, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/me', verifyToken,(req, res) => {
  // Retrieve the token from the 'token' cookie
  const token = req.cookies.token;

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  // Verify the token using jwt
  jwt.verify(token, SECRET_KEY, (err) => {
    if (err) {
      return res.status(401).json({ authenticated: false });
    }

    // If token is valid, return only the authenticated status
    res.json({ authenticated: true });
  });
});


router.post('/logout', (req, res) => {
  console.log("--- DEBUG : LOGOUT CALLED ---");
  res.clearCookie('token', {
    httpOnly: true,
    secure: true, // if used in cookie creation
    sameSite: 'None',
  });
  res.setHeader('X-Debug-Logout', 'Token cookie cleared');
  res.json({ message: 'Logged out' });
});


module.exports = router;
