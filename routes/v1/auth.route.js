const express = require("express");
const {
  login,
  register,
  forgotPassword,
  getLoggedInUserProfile,
  refreshAccessToken,
  resetPassword,
  logout,
} = require("../../controllers/v1/auth.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const router = express.Router();

router.post("/login", login);

router.post("/register", register);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.post("/refresh-token", refreshAccessToken);

router.get("/profile", authMiddleware, getLoggedInUserProfile);

router.post("/logout", logout);

module.exports = router;
