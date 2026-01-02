const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "users",
    },
  },
  {
    timestamps: true,
  }
);

const blogModel = mongoose.model("blogs", blogSchema);

module.exports = blogModel;
