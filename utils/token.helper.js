const jwt = require("jsonwebtoken");
const envVars = require("../constant/envVars");

const generateAccessToken = async (payload) => {
  const accessTokenSecret = envVars.JWT_SECRET + "_access";
  const accessToken = await jwt.sign(payload, accessTokenSecret, {
    expiresIn: "1h", // Access token valid for 1 hour
  });

  return accessToken;
};

const generateRefreshToken = async (payload) => {
  const refreshTokenSecret = envVars.JWT_SECRET + "_refresh";
  const refreshToken = await jwt.sign(payload, refreshTokenSecret, {
    expiresIn: "7d", // Refresh token valid for 7 days
  });

  return refreshToken;
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, envVars.JWT_SECRET + "_access");
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, envVars.JWT_SECRET + "_refresh");
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
