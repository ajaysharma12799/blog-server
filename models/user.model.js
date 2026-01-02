const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    //   name: {
    //     firstName: {
    //       type: String,
    //     },
    //     middleName: {
    //       type: String,
    //     },
    //     lastName: {
    //       type: String,
    //     },
    //   },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    //   mobile: {
    //     countryCode: {
    //       type: String,
    //     },
    //     phoneNumber: {
    //       type: String,
    //     },
    //   },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
