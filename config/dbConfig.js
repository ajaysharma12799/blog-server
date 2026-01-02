const mongoose = require("mongoose");
const envVars = require("../constant/envVars");

const connectDB = async () => {
  try {
    await mongoose.connect(envVars.MONGO_URL);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = connectDB;
