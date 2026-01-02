const { isValidObjectId } = require("mongoose");
const HTTP_STATUS_CODE = require("../../constant/httpStatusCode");
const CommentModel = require("../../models/comment.model");

const getAllCommentsForBlog = async (req, res) => {
  try {
    const blogId = req.params.blogId;

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

    const comments = await CommentModel.find({
      blog: blogId,
    })
      .select("-__v")
      .populate("user", "username");

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const addCommentToBlog = async (req, res) => {
  try {
    const blogId = req.params.blogId;

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

    const { content } = req.body;
    const reqUser = req.user;

    if (!content) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Comment content is required",
      });
    }

    const newComment = new CommentModel({
      blog: blogId,
      user: reqUser.id,
      content,
    });

    await newComment.save();

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;

    if (!commentId) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Comment ID is required",
      });
    }

    if (!isValidObjectId(commentId)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: "error",
        message: "Invalid Comment ID",
      });
    }

    const reqUser = req.user;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: "error",
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== reqUser.id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: "error",
        message: "You are not authorized to delete this comment",
      });
    }

    await CommentModel.findByIdAndDelete(commentId);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: "success",
      message: "Comment deleted successfully",
      data: {
        commentId: commentId,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

const updateComment = async (req, res) => {
  // Future implementation for updating a comment can be added here
};

module.exports = {
  getAllCommentsForBlog,
  addCommentToBlog,
  deleteComment,
  updateComment,
};
