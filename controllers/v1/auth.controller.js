const UserModel = require("../../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const envVars = require("../../constant/envVars");
const HTTP_STATUS_CODE = require("../../constant/httpStatusCode");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../utils/token.helper");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Email and password are required.",
      });
    }

    // Check If user exists
    const existingUser = await UserModel.findOne({ email });

    if (!existingUser) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "User not found. Please register first.",
      });
    }

    // Validate password
    const isPasswordMatching = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordMatching) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid credentials. Please try again.",
      });
    }

    // Payload
    const payload = {
      id: existingUser._id,
      username: existingUser.username,
      email: existingUser.email,
    };

    // Generate Access Token & Refresh Token
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // Save refresh token in DB
    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    // Response
    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Username, email, and password are required.",
      });
    }

    // TODO: Check if user already exists

    const newUser = new UserModel({
      username,
      email,
      password,
    });

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    newUser.password = hashedPassword;

    // Save the user to the database
    await newUser.save();

    res.status(HTTP_STATUS_CODE.CREATED).json({
      status: "success",
      message: "User registered successfully",
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Refresh token is required.",
      });
    }

    // Verify refresh token
    const decodedToken = verifyRefreshToken(refreshToken);
    const userId = decodedToken.id;
    const user = await UserModel.findById(userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid refresh token.",
      });
    }

    // Generate new access token
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    const newAccessToken = await generateAccessToken(payload);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Access token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const forgotPassword = async (req, res) => {
  // To be implemented
};

const resetPassword = async (req, res) => {
  // To be implemented
};

const getLoggedInUserProfile = async (req, res) => {
  try {
    const user = req.user;

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Refresh token is required.",
      });
    }

    // Find User by refresh token
    const user = await UserModel.findOne({ refreshToken });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Invalidate refresh token
    user.refreshToken = null;
    await user.save();

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Logged out successfully",
      data: null,
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  getLoggedInUserProfile,
  refreshAccessToken,
  logout,
};
