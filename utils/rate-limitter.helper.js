const { rateLimit } = require("express-rate-limit");

const rateLimitter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    status: "error",
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

const authRateLimitter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    status: "error",
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

module.exports = { rateLimitter, authRateLimitter };
