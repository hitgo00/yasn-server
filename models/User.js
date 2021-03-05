const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
  },
  //   password: { type: String, required: true },

  clubsNumber: Number,
  bio: String,
  picUrl: String,
  gitHubUrl: String,
  linkedInUrl: String,
  instaUrl: String,
  clubsComm: [String],

  joined: {
    type: Date,
    default: Date.now,
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
});

userSchema.index({name:"text"});

module.exports = mongoose.model("User", userSchema);
