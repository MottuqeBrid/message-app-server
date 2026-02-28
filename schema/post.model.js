const { default: mongoose } = require("mongoose");

const PostModel = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    privacy: {
      type: String,
      enum: ["public", "private", "friends"],
      default: "public",
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true },
);
module.exports = mongoose.model("Post", PostModel);
