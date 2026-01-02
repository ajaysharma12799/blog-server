const BlogModel = require("../../models/blog.model");
const HTTP_STATUS_CODE = require("../../constant/httpStatusCode");
const { isValidObjectId } = require("mongoose");
const envVars = require("../../constant/envVars");
const cloudinary = require("cloudinary").v2;

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status, sortOrder } = req.query;

    let query = {};

    // Search filter
    if (search && search.trim()) {
      query = {
        $or: [
          {
            title: { $regex: search.trim(), $options: "i" },
          },
          {
            shortDescription: { $regex: search.trim(), $options: "i" },
          },
          {
            content: { $regex: search.trim(), $options: "i" },
          },
        ],
      };
    }

    // Status filter
    if (status && ["draft", "published"].includes(status)) {
      query.status = status;
    }

    // Sorting
    let sortCriteria = { createdAt: -1 };
    // sortOrder can be 'asc' or 'desc'
    if (sortOrder === "asc") {
      sortCriteria = { createdAt: 1 };
    } else {
      sortCriteria = { createdAt: -1 };
    }

    const blogs = await BlogModel.find(query)
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .populate("user", "username")
      .sort(sortCriteria);

    const totalBlogs = await BlogModel.countDocuments();
    const totalPages = Math.ceil(totalBlogs / limit);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const createBlog = async (req, res) => {
  try {
    const { title, content, tags, shortDescription } = req.body;
    const reqUser = req.user;

    console.log("tags: ", tags);

    // Basic validation
    if (!title || !content || !shortDescription) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Title, content, and short description are required",
      });
    }

    const slug = title.toLowerCase().replaceAll(" ", "-");
    const tagsInArray = JSON.parse(tags || "[]");

    const newBlog = new BlogModel({
      slug,
      title,
      content,
      shortDescription,
      tags: tagsInArray,
      user: reqUser.id,
      image: req.file?.path,
    });

    await newBlog.save();

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog created successfully",
      data: newBlog,
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const reqUser = req.user;
    const blogId = req.params.id;
    const { title, content, tags, shortDescription } = req.body;

    if (!blogId) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog ID is required",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Invalid Blog ID",
      });
    }

    // Check if the blog exists
    const blog = await BlogModel.findById(blogId);

    if (!blog) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Blog not found",
      });
    }

    // Basic validation
    if (!title || !content || !shortDescription) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Title, content, and short description are required",
      });
    }

    // Article will only be updated by the author
    if (blog.user?.toString() !== reqUser.id) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: "error",
        message: "You are not authorized to update this blog",
      });
    }

    const newTags = [...blog.tags, ...tags];

    // TODO: Image update logic can be added here in future
    /**
     * 1. Delete the previous image from Cloudinary
     * 2. Upload the new image to Cloudinary
     * 3. Update the blog document with the new image URL
     */

    // Update blog fields
    await BlogModel.findByIdAndUpdate(blogId, {
      $set: {
        // image: req.file?.path || blog.image,
        title,
        content,
        shortDescription,
        tags: newTags,
      },
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog updated successfully",
      data: {
        blogId: blog._id,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const reqUser = req.user;
    const blogId = req.params.id;

    if (!blogId) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog ID is required",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Invalid Blog ID",
      });
    }

    // Check if the blog exists
    const blog = await BlogModel.findById(blogId);

    if (!blog) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Blog not found",
      });
    }

    // Article will only be deleted by the author
    if (blog.user?.toString() !== reqUser.id) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: "error",
        message: "You are not authorized to delete this blog",
      });
    }

    // Delete image from Cloudinary if exists
    if (blog.image) {
      // https://res.cloudinary.com/dsk6gelxw/image/upload/v1766161446/euron-fsd-batch-1/chbkp4fx7qzr2xrwvcbk.png
      const imageUniqueId = blog.image.split("/");
      const imageIdWithExtension = imageUniqueId[imageUniqueId.length - 1];
      const imageId = imageIdWithExtension.split(".")[0];
      const publicId = `${envVars.CLOUDINARY_FOLDER}/${imageId}`;

      console.log(
        "Deleting image from Cloudinary:",
        `${envVars.CLOUDINARY_FOLDER}/${imageId}`
      );

      await cloudinary.uploader.destroy(publicId);
    }

    // Delete blog
    await BlogModel.findByIdAndDelete(blogId);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog deleted successfully",
      data: {
        blogId: blog._id,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    if (!slug) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Slug is required",
      });
    }

    // Check if the blog exists
    const blog = await BlogModel.findOne({
      slug,
    })
      .populate("user", "username")
      .select("-__v");

    if (!blog) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Blog not found",
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const publishBlog = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog ID is required to publish a blog",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Invalid Blog ID",
      });
    }

    const blog = await BlogModel.findById(blogId);

    if (!blog) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Blog not found",
      });
    }

    // Check If the blog is already published
    if (blog.status === "published") {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog is already published",
      });
    }

    blog.status = "published";
    await blog.save();

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog published successfully",
      data: {
        blogId: blog._id,
        status: blog.status,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const unPublishBlog = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog ID is required to unpublish a blog",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Invalid Blog ID",
      });
    }

    const blog = await BlogModel.findById(blogId);

    if (!blog) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Blog not found",
      });
    }

    // Check If the blog is already in draft status
    if (blog.status === "draft") {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog is already in draft status",
      });
    }

    blog.status = "draft";
    await blog.save();

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog unpublished successfully",
      data: {
        blogId: blog._id,
        status: blog.status,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

// Like a blog
const likeBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    if (!blogId) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Blog ID is required to like a blog",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Invalid Blog ID",
      });
    }

    const blog = await BlogModel.findById(blogId);
    const reqUser = req.user;

    if (!blog) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Blog not found",
      });
    }

    // Check if the user has already liked the blog
    if (blog.likes.includes(reqUser.id)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "You have already liked this blog",
      });
    }

    // Add user to likes array if not already liked
    const newLikes = [...blog.likes, reqUser.id];

    await BlogModel.findByIdAndUpdate(blogId, {
      $set: {
        likes: newLikes,
      },
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Blog liked successfully",
      data: {
        blogId: blog._id,
        totalLikes: newLikes.length,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

// Unlike a blog - can be implemented similarly
const unlikeBlog = async (req, res) => {
  // Implementation goes here
};

module.exports = {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogBySlug,
  publishBlog,
  unPublishBlog,
  likeBlog,
  unlikeBlog,
};
