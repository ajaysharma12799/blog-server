const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const envVars = require("../constant/envVars");

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: envVars.CLOUDINARY_FOLDER, // The name of the folder in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const multerMiddleware = multer({ storage: storage });

module.exports = multerMiddleware;
