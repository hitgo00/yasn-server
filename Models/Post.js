const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  imageUrl: String,
  videoUrl: String,
  title: {
    type: String,
    required: true,
  },
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  tags: {
    type: [String],
  },
  comments: {
    type: [
      {
        commentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        date: { type: Date, default: Date.now },
        comment: String,
      },
    ],
  },
  likes: {
    count: Number,
    likers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
});

module.exports = mongoose.model("Post", postSchema);
