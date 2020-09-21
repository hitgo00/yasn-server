const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
  },
  message: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },
  hateSpeechFlag: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Message', messageSchema);
