const rateLimit = require("express-rate-limit");

const Limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

module.exports = { Limiter }