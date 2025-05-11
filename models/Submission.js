const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  audioURL: String,
  contentType: String,
  transcript: String,
  language: String,
  accent: String,
  dialect: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Submission", submissionSchema);
