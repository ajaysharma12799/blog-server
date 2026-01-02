const HTTP_STATUS_CODE = require("../constant/httpStatusCode");
const envVars = require("../constant/envVars");
const userModel = require("../models/user.model");
const { verifyAccessToken } = require("../utils/token.helper");

const authMiddleware = async (req, res, next) => {
  try {
    // Get Logged in user info from req.user
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    const decodedToken = verifyAccessToken(token);
    const userId = decodedToken.id;

    const user = await userModel
      .findById(userId)
      .select("-password -refreshToken -__v");

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "User not found",
      });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = authMiddleware;
