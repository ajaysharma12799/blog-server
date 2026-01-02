require("dotenv").config({
  path: process.env.NODE_ENV === "development" ? ".env.development" : ".env",
});
const cors = require("cors");
const helmet = require("helmet");
const express = require("express");
const connectDB = require("./config/dbConfig");
const { rateLimitter } = require("./utils/rate-limitter.helper");

const app = express();
const PORT = process.env.PORT || 1234;

console.log("Node Environment:", process.env.NODE_ENV);

// Connect to Database
connectDB();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(rateLimitter);
app.use(express.json());

// Intial Route
app.get("/", (request, response) => {
  response.status(200).json({
    status: "success",
    message: "Server is up and running",
  });
});

// Routes
app.use("/api/v1/auth", require("./routes/v1/auth.route"));
app.use("/api/v1/blogs", require("./routes/v1/blog.route"));
app.use("/api/v1/comments", require("./routes/v1/comment.route"));

app.listen(PORT, (error) => {
  if (error) {
    console.error("Error starting the server:", error);
  }

  console.log(`Server is running on port http://localhost:${PORT}`);
});
