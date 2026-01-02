const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const multerMiddleware = require("../../middleware/multer.middleware");
const {
  getAllBlogs,
  createBlog,
  deleteBlog,
  updateBlog,
  getBlogBySlug,
  publishBlog,
  likeBlog,
  unlikeBlog,
} = require("../../controllers/v1/blog.controller");

const router = express.Router();

router.get("/", getAllBlogs);

router.post("/", authMiddleware, multerMiddleware.single("image"), createBlog);

router.put("/:id", authMiddleware, updateBlog);

router.delete("/:id", authMiddleware, deleteBlog);

router.get("/:slug", getBlogBySlug);

router.post("/publish", authMiddleware, publishBlog);

router.patch("/like/:id", authMiddleware, likeBlog);

router.patch("/unlike/:id", authMiddleware, unlikeBlog);

module.exports = router;
