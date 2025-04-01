const express = require("express");
const sequelize = require("../database");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const sendMail = require("../mailer");
const { QueryTypes } = require("sequelize");

const SECRET_KEY = process.env.JWT_SECRET;

router.get("/about", (req, res) => {
  res.send("About this app");
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email, and password are required" });
  }

  try {
    const verificationToken = crypto.randomBytes(32).toString("hex"); // Generate token

    await sequelize.query(
      "INSERT INTO rrpm_user (login, hashed_master_password, is_verified, verification_token) VALUES (:email, :password, FALSE, :verificationToken);",
      {
        replacements: { email, password, verificationToken },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    const verificationLink = `http://localhost:3001/auth/verify-email?token=${verificationToken}`;
    await sendMail(
      email,
      "Verify Your Email",
      `Click the link to verify your email: ${verificationLink}`,
      null
    );

    res
      .status(201)
      .json({
        message: "User registered. Please verify your email before logging in.",
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Invalid or missing token" });
  }

  try {
    const [user] = await sequelize.query(
      "SELECT id FROM rrpm_user WHERE verification_token = :token;",
      {
        replacements: { token },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    await sequelize.query(
      "UPDATE rrpm_user SET is_verified = TRUE, verification_token = NULL WHERE id = :id;",
      {
        replacements: { id: user.id },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(password);

  try {
    const user = await sequelize.query(
      "SELECT id, login, hashed_master_password, is_verified FROM rrpm_user WHERE login = ?",
      {
        replacements: [email],
        type: QueryTypes.SELECT,
      }
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User not found" });
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

    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour > rajouter le secure: true , httpOnly: true,en prod

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/me', (req, res) => {
  // Retrieve the token from the 'token' cookie
  const token = req.cookies.token;

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  // Verify the token using jwt
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ authenticated: false });
    }

    // If token is valid, return authenticated status and user info
    res.json({ authenticated: true, user: decoded });
  });
});


router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
